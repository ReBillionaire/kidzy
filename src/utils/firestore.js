import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getDefaultCategories, generateId } from './storage';

// ── Invite Code Generation ──────────────────────────────────────────
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── User Profile ────────────────────────────────────────────────────

/** Create or update user profile in /users/{uid} */
export async function setUserProfile(uid, data) {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), {
    email: data.email || '',
    name: data.name || 'Parent',
    avatar: data.avatar || null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Get user profile */
export async function getUserProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Get all family IDs for a user */
export async function getUserFamilies(uid) {
  if (!db) return [];
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  return snap.data().families || [];
}

/** Add a family ID to user's family list */
export async function addFamilyToUser(uid, familyId) {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), {
    families: arrayUnion(familyId),
  }, { merge: true });
}

/** Remove a family ID from user's family list */
export async function removeFamilyFromUser(uid, familyId) {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    families: arrayRemove(familyId),
  });
}

// ── Family CRUD ─────────────────────────────────────────────────────

/** Create a new family */
export async function createFamily(uid, familyName, parentName, avatar, email) {
  if (!db) return null;
  const familyId = generateId('fam');
  const parentId = generateId('parent');
  const inviteCode = generateInviteCode();

  const familyData = {
    name: familyName,
    inviteCode,
    ownerId: uid,
    createdAt: serverTimestamp(),
    // Full family state stored as a single document for simplicity
    parents: [{
      id: parentId,
      uid,
      name: parentName,
      avatar: avatar || null,
      email: email || '',
      role: 'admin',
      createdAt: new Date().toISOString(),
    }],
    kids: [],
    behaviorCategories: getDefaultCategories(),
    transactions: [],
    wishListItems: [],
    dreamGoals: [],
    challenges: [],
    settings: {
      currency: '$',
      weekStartDay: 'monday',
      dailyCheckInReminder: true,
      soundEnabled: true,
      hapticEnabled: true,
    },
    onboardingComplete: false,
  };

  await setDoc(doc(db, 'families', familyId), familyData);
  await addFamilyToUser(uid, familyId);

  return { familyId, parentId, inviteCode, familyData };
}

/** Get family data */
export async function getFamily(familyId) {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'families', familyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Get multiple families by IDs */
export async function getFamilies(familyIds) {
  if (!db || !familyIds.length) return [];
  const families = [];
  for (const id of familyIds) {
    const family = await getFamily(id);
    if (family) families.push(family);
  }
  return families;
}

/** Find a family by invite code */
export async function findFamilyByInviteCode(code) {
  if (!db) return null;
  const q = query(collection(db, 'families'), where('inviteCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/** Join a family using invite code */
export async function joinFamily(uid, inviteCode, parentName, avatar, email) {
  if (!db) return null;
  const family = await findFamilyByInviteCode(inviteCode);
  if (!family) throw new Error('Invalid invite code. Please check and try again.');

  // Check if user already belongs to this family
  const existingMember = family.parents?.find(p => p.uid === uid);
  if (existingMember) throw new Error('You already belong to this family.');

  const parentId = generateId('parent');
  const newParent = {
    id: parentId,
    uid,
    name: parentName,
    avatar: avatar || null,
    email: email || '',
    role: 'parent',
    createdAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, 'families', family.id), {
    parents: [...(family.parents || []), newParent],
  });
  await addFamilyToUser(uid, family.id);

  return { familyId: family.id, parentId, familyName: family.name };
}

/** Update entire family state (used by reducer sync) */
export async function updateFamilyState(familyId, state) {
  if (!db || !familyId) return;
  // Strip out transient UI state, keep only persistent data
  const { currentParentId, loggedOut, kidMode, ...persistState } = state;
  await updateDoc(doc(db, 'families', familyId), persistState);
}

/** Subscribe to real-time family updates */
export function subscribeFamilyUpdates(familyId, callback) {
  if (!db || !familyId) return () => {};
  return onSnapshot(doc(db, 'families', familyId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  }, (error) => {
    console.error('[Kidzy] Family sync error:', error);
  });
}

/** Regenerate invite code for a family */
export async function regenerateInviteCode(familyId) {
  if (!db) return null;
  const newCode = generateInviteCode();
  await updateDoc(doc(db, 'families', familyId), { inviteCode: newCode });
  return newCode;
}

/** Leave a family (remove self) */
export async function leaveFamily(uid, familyId) {
  if (!db) return;
  const family = await getFamily(familyId);
  if (!family) return;

  const updatedParents = (family.parents || []).filter(p => p.uid !== uid);
  await updateDoc(doc(db, 'families', familyId), { parents: updatedParents });
  await removeFamilyFromUser(uid, familyId);
}
