// must pass in firebaseApp because getFirestore() function always returns undefined when trying to fetch default app on its own accord - I think because it's designed to work in the client once Firestore has been initialized and not in one synchronous server-side operation

import type { FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
} from 'firebase/firestore';

type CollectionPredicate<T> = string | CollectionReference<T>;
type DocPredicate<T> = string | DocumentReference<T>;

export function colRef<T>(
  ref: CollectionPredicate<T>,
  firebaseApp: FirebaseApp
): CollectionReference<T> {
  const db = getFirestore(firebaseApp);
  return typeof ref === 'string' ? (collection(db, ref) as CollectionReference<T>) : ref;
}

export function docRef<T>(ref: DocPredicate<T>, firebaseApp: FirebaseApp): DocumentReference<T> {
  if (typeof ref === 'string') {
    const pathParts = ref.split('/');
    const documentId = pathParts.pop();
    const collectionString = pathParts.join('/');
    return doc<T>(colRef(collectionString, firebaseApp), documentId);
  } else {
    return ref;
  }
}

export async function getCollection<T>(
  path: CollectionPredicate<T>,
  queryConstraints: QueryConstraint[] = [],
  firebaseApp: FirebaseApp
): Promise<T[]> {
  const ref = typeof path === 'string' ? colRef<T>(path, firebaseApp) : path;
  const q = query(ref, ...queryConstraints);
  const collectionSnap = await getDocs(q);
  return collectionSnap.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  }));
}

export async function getDocument<T>(ref: DocPredicate<T>, firebaseApp: FirebaseApp): Promise<T> {
  const docSnap = await getDoc(docRef(ref, firebaseApp));
  return docSnap.exists() ? { ...(docSnap.data() as T), id: docSnap.id } : null;
}