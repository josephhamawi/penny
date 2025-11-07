import { auth, firestore } from '../config/firebase';

const getUserGoalsCollection = (userId) => {
  return firestore.collection(`users/${userId}/goals`);
};

export const createGoal = async (goalData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const goalRef = getUserGoalsCollection(user.uid).doc();

  const goal = {
    id: goalRef.id,
    userId: user.uid,
    name: goalData.name,
    targetAmount: parseFloat(goalData.targetAmount),
    currentAmount: 0,
    targetDate: goalData.targetDate,
    categoryRestrictions: goalData.categoryRestrictions || null,
    status: 'active',
    aiRecommendations: null,
    successProbability: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await goalRef.set(goal);
  return goalRef.id;
};

export const subscribeToGoals = (userId, callback) => {
  if (!userId) throw new Error('userId required');

  return getUserGoalsCollection(userId)
    .orderBy('targetDate', 'asc')
    .onSnapshot((snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        targetDate: doc.data().targetDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
      callback(goals);
    });
};

export const updateGoal = async (goalId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserGoalsCollection(user.uid).doc(goalId).update({
    ...updates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const deleteGoal = async (goalId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserGoalsCollection(user.uid).doc(goalId).delete();
};

export const updateGoalProgress = async (goalId, currentAmount, successProbability) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserGoalsCollection(user.uid).doc(goalId).update({
    currentAmount,
    successProbability,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const saveAIRecommendations = async (goalId, recommendations) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await getUserGoalsCollection(user.uid).doc(goalId).update({
    aiRecommendations: {
      text: recommendations,
      generatedAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
    },
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};
