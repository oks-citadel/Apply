"""
Feedback learning system for retraining the interview probability model.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, brier_score_loss
import structlog

from .database_models import TrainingDataPoint, ModelMetrics, MatchFeedback, OutcomeType

logger = structlog.get_logger()


class FeedbackLearningSystem:
    """
    System for continuous learning from application outcomes.

    Features:
    - Incremental model updates
    - Multiple model ensembles
    - Calibrated probability predictions
    - Performance tracking
    - Feature importance analysis
    """

    def __init__(self):
        """Initialize learning system."""
        self.models = {
            "gradient_boosting": GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            ),
            "random_forest": RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            ),
            "logistic": LogisticRegression(
                random_state=42,
                max_iter=1000
            )
        }

        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = [
            "skill_overlap",
            "skill_depth",
            "experience_years",
            "seniority_gap",
            "industry_match",
            "education_level",
            "education_match",
            "keyword_density",
            "recent_experience_relevance",
            "company_size_match",
            "location_match"
        ]

        self.current_version = "1.0.0"
        self.last_trained_at: Optional[datetime] = None
        self.training_history: List[ModelMetrics] = []

        logger.info("Feedback learning system initialized")

    def prepare_training_data(
        self,
        data_points: List[TrainingDataPoint]
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare training data from data points.

        Args:
            data_points: List of training data points

        Returns:
            Tuple of (features, targets, weights)
        """
        if not data_points:
            raise ValueError("No training data provided")

        # Extract features
        features = []
        targets = []
        weights = []

        for point in data_points:
            feature_vector = [
                point.skill_overlap,
                point.skill_depth,
                point.experience_years / 20.0,  # Normalize
                (point.seniority_gap + 2) / 4.0,  # Normalize -2 to +2 -> 0 to 1
                float(point.industry_match),
                point.education_level / 5.0,  # Normalize
                float(point.education_match),
                point.keyword_density,
                point.recent_experience_relevance,
                float(point.company_size_match),
                float(point.location_match)
            ]

            features.append(feature_vector)
            targets.append(point.outcome_score)
            weights.append(point.weight)

        return (
            np.array(features),
            np.array(targets),
            np.array(weights)
        )

    def train(
        self,
        training_data: List[TrainingDataPoint],
        validation_split: float = 0.2
    ) -> ModelMetrics:
        """
        Train models on feedback data.

        Args:
            training_data: Training data points
            validation_split: Fraction of data for validation

        Returns:
            Model performance metrics
        """
        logger.info(
            "Starting model training",
            samples=len(training_data),
            validation_split=validation_split
        )

        # Prepare data
        X, y, weights = self.prepare_training_data(training_data)

        # Split data
        X_train, X_val, y_train, y_val, w_train, w_val = train_test_split(
            X, y, weights,
            test_size=validation_split,
            random_state=42,
            stratify=(y > 0.25).astype(int)  # Stratify by outcome class
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)

        # Train each model
        logger.info("Training ensemble models...")

        for name, model in self.models.items():
            logger.info(f"Training {name} model...")

            # Train
            if hasattr(model, "sample_weight"):
                model.fit(X_train_scaled, y_train, sample_weight=w_train)
            else:
                model.fit(X_train_scaled, y_train)

            logger.info(f"{name} model trained")

        self.is_trained = True
        self.last_trained_at = datetime.utcnow()

        # Evaluate
        metrics = self.evaluate(X_val_scaled, y_val)

        # Calculate feature importance
        feature_importance = self._calculate_feature_importance()

        # Create metrics record
        model_metrics = ModelMetrics(
            model_version=self.current_version,
            trained_at=self.last_trained_at,
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1"],
            auc_roc=metrics["auc_roc"],
            calibration_error=metrics["calibration_error"],
            brier_score=metrics["brier_score"],
            training_samples=len(X_train),
            validation_samples=len(X_val),
            test_samples=0,
            top_features=feature_importance,
            metadata={
                "validation_split": validation_split,
                "training_date": self.last_trained_at.isoformat()
            }
        )

        self.training_history.append(model_metrics)

        logger.info(
            "Model training completed",
            version=self.current_version,
            accuracy=metrics["accuracy"],
            auc_roc=metrics["auc_roc"]
        )

        return model_metrics

    def predict_probability(self, features: Dict[str, Any]) -> float:
        """
        Predict interview probability from features.

        Args:
            features: Feature dictionary

        Returns:
            Predicted probability
        """
        if not self.is_trained:
            logger.warning("Model not trained, using default prediction")
            return 0.5  # Default probability

        # Convert features to array
        feature_vector = [
            features.get("skill_overlap", 0.5),
            features.get("skill_depth", 0.5),
            features.get("experience_years", 5) / 20.0,
            (features.get("seniority_gap", 0) + 2) / 4.0,
            float(features.get("industry_match", False)),
            features.get("education_level", 3) / 5.0,
            float(features.get("education_match", True)),
            features.get("keyword_density", 0.5),
            features.get("recent_experience_relevance", 0.5),
            float(features.get("company_size_match", False)),
            float(features.get("location_match", True))
        ]

        X = np.array([feature_vector])
        X_scaled = self.scaler.transform(X)

        # Ensemble prediction (average of all models)
        probabilities = []

        for name, model in self.models.items():
            if hasattr(model, "predict_proba"):
                # For classifiers with predict_proba
                proba = model.predict_proba(X_scaled)[0]
                # Get probability of positive class
                if len(proba) > 1:
                    probabilities.append(proba[1])
                else:
                    probabilities.append(proba[0])
            else:
                # For regressors
                pred = model.predict(X_scaled)[0]
                probabilities.append(np.clip(pred, 0.0, 1.0))

        # Average ensemble
        avg_probability = float(np.mean(probabilities))

        return np.clip(avg_probability, 0.0, 1.0)

    def evaluate(
        self,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> Dict[str, float]:
        """
        Evaluate model performance.

        Args:
            X_val: Validation features
            y_val: Validation targets

        Returns:
            Performance metrics
        """
        # Get ensemble predictions
        predictions = []
        probabilities = []

        for model in self.models.values():
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X_val)
                if proba.shape[1] > 1:
                    probabilities.append(proba[:, 1])
                else:
                    probabilities.append(proba[:, 0])
            else:
                pred = model.predict(X_val)
                probabilities.append(np.clip(pred, 0.0, 1.0))

        # Average probabilities
        avg_proba = np.mean(probabilities, axis=0)

        # Convert to binary predictions (threshold at 0.5)
        y_pred = (avg_proba > 0.5).astype(int)
        y_true = (y_val > 0.25).astype(int)  # 0=rejected, 0.5+=interview/offer

        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)

        # AUC-ROC
        try:
            auc_roc = roc_auc_score(y_true, avg_proba)
        except ValueError:
            auc_roc = 0.5

        # Brier score (probability accuracy)
        brier = brier_score_loss(y_true, avg_proba)

        # Calibration error (simplified)
        calibration_error = self._calculate_calibration_error(y_true, avg_proba)

        return {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "auc_roc": float(auc_roc),
            "brier_score": float(brier),
            "calibration_error": float(calibration_error)
        }

    def _calculate_calibration_error(
        self,
        y_true: np.ndarray,
        y_proba: np.ndarray,
        n_bins: int = 10
    ) -> float:
        """Calculate expected calibration error."""
        # Bin predictions
        bin_edges = np.linspace(0, 1, n_bins + 1)
        bin_indices = np.digitize(y_proba, bin_edges[1:-1])

        calibration_error = 0.0

        for i in range(n_bins):
            mask = bin_indices == i
            if mask.sum() > 0:
                bin_accuracy = y_true[mask].mean()
                bin_confidence = y_proba[mask].mean()
                bin_size = mask.sum()

                calibration_error += (bin_size / len(y_true)) * abs(bin_accuracy - bin_confidence)

        return calibration_error

    def _calculate_feature_importance(self) -> List[Dict[str, float]]:
        """Calculate feature importance across models."""
        importance_scores = {}

        # Get importance from tree-based models
        for name, model in self.models.items():
            if hasattr(model, "feature_importances_"):
                for i, importance in enumerate(model.feature_importances_):
                    feature_name = self.feature_names[i]
                    if feature_name not in importance_scores:
                        importance_scores[feature_name] = []
                    importance_scores[feature_name].append(importance)

        # Average importance across models
        avg_importance = []
        for feature, scores in importance_scores.items():
            avg_importance.append({
                "feature": feature,
                "importance": float(np.mean(scores))
            })

        # Sort by importance
        avg_importance.sort(key=lambda x: x["importance"], reverse=True)

        return avg_importance[:10]  # Top 10 features

    def incremental_update(
        self,
        new_data: List[TrainingDataPoint]
    ) -> ModelMetrics:
        """
        Incrementally update models with new feedback data.

        Args:
            new_data: New training data points

        Returns:
            Updated model metrics
        """
        logger.info(
            "Performing incremental model update",
            new_samples=len(new_data)
        )

        if not self.is_trained:
            # If not trained yet, do full training
            return self.train(new_data)

        # For simplicity, retrain on all data
        # In production, you'd use proper incremental learning
        # or periodically retrain on a rolling window of data

        # Combine with historical data if available
        # For now, just train on new data
        return self.train(new_data)

    def get_prediction_confidence(
        self,
        features: Dict[str, Any]
    ) -> float:
        """
        Get confidence in prediction based on ensemble variance.

        Args:
            features: Feature dictionary

        Returns:
            Confidence score (0-1)
        """
        if not self.is_trained:
            return 0.5

        # Convert features to array
        feature_vector = [
            features.get("skill_overlap", 0.5),
            features.get("skill_depth", 0.5),
            features.get("experience_years", 5) / 20.0,
            (features.get("seniority_gap", 0) + 2) / 4.0,
            float(features.get("industry_match", False)),
            features.get("education_level", 3) / 5.0,
            float(features.get("education_match", True)),
            features.get("keyword_density", 0.5),
            features.get("recent_experience_relevance", 0.5),
            float(features.get("company_size_match", False)),
            float(features.get("location_match", True))
        ]

        X = np.array([feature_vector])
        X_scaled = self.scaler.transform(X)

        # Get predictions from all models
        probabilities = []

        for model in self.models.values():
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X_scaled)[0]
                if len(proba) > 1:
                    probabilities.append(proba[1])
                else:
                    probabilities.append(proba[0])
            else:
                pred = model.predict(X_scaled)[0]
                probabilities.append(np.clip(pred, 0.0, 1.0))

        # Calculate variance (low variance = high confidence)
        variance = np.var(probabilities)

        # Convert variance to confidence (higher variance = lower confidence)
        confidence = 1.0 - min(variance * 10, 1.0)  # Scale and cap at 1.0

        return float(np.clip(confidence, 0.0, 1.0))

    def get_latest_metrics(self) -> Optional[ModelMetrics]:
        """Get latest model performance metrics."""
        if not self.training_history:
            return None

        return self.training_history[-1]

    def should_retrain(
        self,
        min_new_samples: int = 100,
        max_days_since_training: int = 30
    ) -> bool:
        """
        Determine if model should be retrained.

        Args:
            min_new_samples: Minimum new samples needed
            max_days_since_training: Maximum days since last training

        Returns:
            True if retraining is recommended
        """
        if not self.is_trained:
            return True

        # Check time since last training
        if self.last_trained_at:
            days_since = (datetime.utcnow() - self.last_trained_at).days
            if days_since >= max_days_since_training:
                logger.info(
                    "Retraining recommended: time threshold exceeded",
                    days_since=days_since
                )
                return True

        return False
