import numpy as np
from sklearn.decomposition import NMF
from sklearn.metrics import mean_squared_error


class MF(object):
    """docstring for MF"""

    def __init__(
        self,
        Y_data,
        K,
        lam=0.1,
        Xinit=None,
        Winit=None,
        learning_rate=0.5,
        max_iter=1000,
        user_based=1,
    ):
        self.Y_raw_data = Y_data
        self.K = K
        # regularization parameter
        self.lam = lam
        # learning rate for gradient descent
        self.learning_rate = learning_rate
        # maximum number of iterations
        self.max_iter = max_iter
        # user-based or item-based
        self.user_based = user_based
        # number of users, items, and ratings. Remember to add 1 since id starts from 0
        self.n_users = int(np.max(Y_data[:, 0])) + 1
        self.n_items = int(np.max(Y_data[:, 1])) + 1
        self.n_ratings = Y_data.shape[0]

        if Xinit is None:  # new
            self.X = np.random.randn(self.n_items, K)
        else:  # or from saved data
            self.X = Xinit

        if Winit is None:
            self.W = np.random.randn(K, self.n_users)
        else:  # from daved data
            self.W = Winit

        # normalized data, update later in normalized_Y function
        self.Y_data_n = self.Y_raw_data.copy()

    def normalize_Y(self):
        if self.user_based:
            user_col = 0
            item_col = 1
            n_objects = self.n_users

        # if we want to normalize based on item, just switch first two columns of data
        else:  # item bas
            user_col = 1
            item_col = 0
            n_objects = self.n_items

        users = self.Y_raw_data[:, user_col]
        self.mu = np.zeros((n_objects,))
        for n in range(n_objects):
            # row indices of rating done by user n
            # since indices need to be integers, we need to convert
            ids = np.where(users == n)[0].astype(np.int32)
            # indices of all ratings associated with user n
            item_ids = self.Y_data_n[ids, item_col]
            # and the corresponding ratings
            ratings = self.Y_data_n[ids, 2]
            # take mean
            m = np.mean(ratings)
            if np.isnan(m):
                m = 0  # to avoid empty array and nan value
            self.mu[n] = m
            # normalize
            self.Y_data_n[ids, 2] = ratings - self.mu[n]

    # Compute the loss function
    def loss(self):
        L = 0
        for i in range(self.n_ratings):
            # user, item, rating
            n, m, rate = (
                int(self.Y_data_n[i, 0]),
                int(self.Y_data_n[i, 1]),
                self.Y_data_n[i, 2],
            )
            L += 0.5 * (rate - self.X[m, :].dot(self.W[:, n])) ** 2

        # take average
        L /= self.n_ratings
        # regularization, don't ever forget this
        L += (
            0.5
            * self.lam
            * (np.linalg.norm(self.X, "fro") + np.linalg.norm(self.W, "fro"))
        )
        return L

    # Identify items rated by a user, and users who rated an item along with corresponding ratings
    def get_items_rated_by_user(self, user_id):
        """
        get all items which are rated by user user_id, and the corresponding ratings
        """
        ids = np.where(self.Y_data_n[:, 0] == user_id)[0]
        item_ids = self.Y_data_n[ids, 1].astype(np.int32)  # indices need to be integers
        ratings = self.Y_data_n[ids, 2]
        return (item_ids, ratings)

    def get_users_who_rate_item(self, item_id):
        """
        get all users who rated item item_id and get the corresponding ratings
        """
        ids = np.where(self.Y_data_n[:, 1] == item_id)[0]
        user_ids = self.Y_data_n[ids, 0].astype(np.int32)
        ratings = self.Y_data_n[ids, 2]
        return (user_ids, ratings)

    # Update X, W:
    def updateX(self):
        for m in range(self.n_items):
            user_ids, ratings = self.get_users_who_rate_item(m)
            Wm = self.W[:, user_ids]
            # gradient
            grad_xm = (
                -(ratings - self.X[m, :].dot(Wm)).dot(Wm.T) / self.n_ratings
                + self.lam * self.X[m, :]
            )
            self.X[m, :] -= self.learning_rate * grad_xm.reshape((self.K,))

    def updateW(self):
        for n in range(self.n_users):
            item_ids, ratings = self.get_items_rated_by_user(n)
            Xn = self.X[item_ids, :]
            # gradient
            grad_wn = (
                -Xn.T.dot(ratings - Xn.dot(self.W[:, n])) / self.n_ratings
                + self.lam * self.W[:, n]
            )
            self.W[:, n] -= self.learning_rate * grad_wn.reshape((self.K,))

    # fit function
    def fit(self):
        self.normalize_Y()
        for it in range(self.max_iter):
            self.updateX()
            self.updateW()
            if it % 10 == 0:
                print(f"Iteration {it}/{self.max_iter}, Loss: {self.loss()}")

    # Predict function
    def pred(self, u, i):
        """
        predict the rating of user u for item i
        if you need the un
        """
        u = int(u)
        i = int(i)
        if self.user_based:
            bias = self.mu[u]
        else:
            bias = self.mu[i]
        pred = self.X[i, :].dot(self.W[:, u]) + bias
        # truncate if results are out of range [0, 5]
        if pred < 0:

            return 0
        if pred > 5:
            return 5
        return pred

    def pred_for_user(self, user_id):
        """
        predict ratings one user give all unrated items
        """
        ids = np.where(self.Y_data_n[:, 0] == user_id)[0]
        items_rated_by_u = self.Y_data_n[ids, 1].tolist()

        y_pred = self.X.dot(self.W[:, user_id]) + self.mu[user_id]
        predicted_ratings = []
        for i in range(self.n_items):
            if i not in items_rated_by_u:
                predicted_ratings.append((i, y_pred[i]))

        return predicted_ratings

    # Evaluate the model using Root Mean Square Error:
    def evaluate_RMSE(self, rate_test):
        n_tests = rate_test.shape[0]
        SE = 0  # squared error
        for n in range(n_tests):
            pred = self.pred(rate_test[n, 0], rate_test[n, 1])
            SE += (pred - rate_test[n, 2]) ** 2

        RMSE = np.sqrt(SE / n_tests)
        return RMSE

    # Recommendation function
    def recommend(self, u):
        """
        Determine all items should be recommended for user u.
        The decision is made based on all i such that:
        self.pred(u, i) > 0. Suppose we are considering items which
        have not been rated by u yet.
        """
        ids = np.where(self.Y_raw_data[:, 0] == u)[0]
        items_rated_by_u = self.Y_raw_data[ids, 1].tolist()
        recommended_items = []
        for i in range(self.n_items):
            if i not in items_rated_by_u:
                rating = self.X[i, :].dot(self.W[:, u])
                if rating > 0:
                    recommended_items.append(i)

        return recommended_items

    # Add serialization methods
    def to_dict(self):
        """
        Convert the model to a dictionary for easy serialization
        """
        return {
            "X": self.X.tolist(),
            "W": self.W.tolist(),
            "mu": self.mu.tolist(),
            "K": self.K,
            "lam": self.lam,
            "learning_rate": self.learning_rate,
            "max_iter": self.max_iter,
            "user_based": self.user_based,
            "n_users": self.n_users,
            "n_items": self.n_items,
        }

    @classmethod
    def from_dict(cls, data_dict, Y_data):
        """
        Reconstruct the model from a dictionary

        :param data_dict: Dictionary containing model parameters
        :param Y_data: Original rating data matrix
        :return: Reconstructed MF model
        """
        # Create a new instance with the same Y_data and parameters
        model = cls(
            Y_data=Y_data,
            K=data_dict["K"],
            lam=data_dict["lam"],
            learning_rate=data_dict["learning_rate"],
            max_iter=data_dict["max_iter"],
            user_based=data_dict["user_based"],
        )

        # Override the initialized matrices with saved values
        model.X = np.array(data_dict["X"])
        model.W = np.array(data_dict["W"])
        model.mu = np.array(data_dict["mu"])
        model.n_users = data_dict["n_users"]
        model.n_items = data_dict["n_items"]

        return model
