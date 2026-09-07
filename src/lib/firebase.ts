import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  Firestore 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { 
  Project, 
  Bug, 
  TestPlan, 
  TestCase, 
  TestRun, 
  Comment, 
  Activity, 
  TeamMember,
  BugStatus 
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_BUGS, 
  INITIAL_TEST_PLANS, 
  INITIAL_TEST_CASES, 
  INITIAL_TEST_RUNS, 
  INITIAL_COMMENTS, 
  INITIAL_ACTIVITIES 
} from '../data/seedData';
import { api } from './api';

// Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigData);

let db: Firestore | null = null;
try {
  if (firebaseConfigData.firestoreDatabaseId) {
    db = getFirestore(app, firebaseConfigData.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firestore init issue, fallback to memory/localStorage:', e);
  try {
    db = getFirestore(app);
  } catch (err) {
    console.error('Firestore fallback failed:', err);
  }
}

export { db };

// Local storage keys
const LS_KEYS = {
  PROJECTS: 'qa_hub_projects_v3',
  BUGS: 'qa_hub_bugs_v3',
  TEST_PLANS: 'qa_hub_test_plans_v3',
  TEST_CASES: 'qa_hub_test_cases_v3',
  TEST_RUNS: 'qa_hub_test_runs_v3',
  COMMENTS: 'qa_hub_comments_v3',
  ACTIVITIES: 'qa_hub_activities_v3',
  SEEDED: 'qa_hub_seeded_v4',
};

export function isAlreadySeeded(): boolean {
  try {
    return localStorage.getItem(LS_KEYS.SEEDED) === 'true';
  } catch {
    return false;
  }
}

export function markSeeded(): void {
  try {
    localStorage.setItem(LS_KEYS.SEEDED, 'true');
  } catch {}
}

// Recursive sanitizer to strip undefined values so Firestore setDoc never throws Unsupported field value: undefined
function sanitizeForFirestore<T>(data: T): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  return data;
}

// Active in-memory subscribers
const projectListeners = new Set<(projects: Project[]) => void>();
const bugListeners = new Set<(bugs: Bug[]) => void>();
const testPlanListeners = new Set<(plans: TestPlan[]) => void>();
const testCaseListeners = new Set<(cases: TestCase[]) => void>();
const testRunListeners = new Set<(runs: TestRun[]) => void>();
const commentListeners = new Set<(comments: Comment[]) => void>();
const activityListeners = new Set<(activities: Activity[]) => void>();

function notifyProjectListeners(data: Project[]) {
  projectListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('Project listener error:', e); }
  });
}
function notifyBugListeners(data: Bug[]) {
  bugListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('Bug listener error:', e); }
  });
}
function notifyTestPlanListeners(data: TestPlan[]) {
  testPlanListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('TestPlan listener error:', e); }
  });
}
function notifyTestCaseListeners(data: TestCase[]) {
  testCaseListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('TestCase listener error:', e); }
  });
}
function notifyTestRunListeners(data: TestRun[]) {
  testRunListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('TestRun listener error:', e); }
  });
}
function notifyCommentListeners(data: Comment[]) {
  commentListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('Comment listener error:', e); }
  });
}
function notifyActivityListeners(data: Activity[]) {
  activityListeners.forEach(cb => {
    try { cb(data); } catch (e) { console.error('Activity listener error:', e); }
  });
}

function getLocalData<T>(key: string, defaultSeed: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    // If not in localStorage:
    if (isAlreadySeeded()) {
      return [];
    }
    // First time launch before seeding:
    return defaultSeed;
  } catch {
    return isAlreadySeeded() ? [] : defaultSeed;
  }
}

function setLocalData<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write to localStorage:', err);
  }
}

// Purge orphan documents from Firestore and localStorage whose projectId is not in activeProjects
export async function cleanOrphanArtifacts(activeProjects: Project[]): Promise<void> {
  if (!activeProjects || activeProjects.length === 0) return;
  const validProjectIds = new Set(activeProjects.map(p => p.id));

  // 1. Clean local storage & listeners for Bugs
  const localBugs = getLocalData<Bug>(LS_KEYS.BUGS, []);
  const validLocalBugs = localBugs.filter(b => b.projectId && validProjectIds.has(b.projectId));
  if (validLocalBugs.length !== localBugs.length) {
    setLocalData(LS_KEYS.BUGS, validLocalBugs);
    notifyBugListeners(validLocalBugs);
  }

  // 2. Clean local storage & listeners for Test Plans
  const localPlans = getLocalData<TestPlan>(LS_KEYS.TEST_PLANS, []);
  const validLocalPlans = localPlans.filter(tp => tp.projectId && validProjectIds.has(tp.projectId));
  if (validLocalPlans.length !== localPlans.length) {
    setLocalData(LS_KEYS.TEST_PLANS, validLocalPlans);
    notifyTestPlanListeners(validLocalPlans);
  }

  // 3. Clean local storage & listeners for Test Cases
  const localCases = getLocalData<TestCase>(LS_KEYS.TEST_CASES, []);
  const validLocalCases = localCases.filter(tc => tc.projectId && validProjectIds.has(tc.projectId));
  if (validLocalCases.length !== localCases.length) {
    setLocalData(LS_KEYS.TEST_CASES, validLocalCases);
    notifyTestCaseListeners(validLocalCases);
  }

  // 4. Clean local storage & listeners for Test Runs
  const localRuns = getLocalData<TestRun>(LS_KEYS.TEST_RUNS, []);
  const validLocalRuns = localRuns.filter(tr => tr.projectId && validProjectIds.has(tr.projectId));
  if (validLocalRuns.length !== localRuns.length) {
    setLocalData(LS_KEYS.TEST_RUNS, validLocalRuns);
    notifyTestRunListeners(validLocalRuns);
  }

  // 5. Clean Firestore database permanently
  if (db) {
    try {
      const deletePromises: Promise<any>[] = [];
      const orphanBugIds = new Set<string>();

      // Bugs
      const bugsSnap = await getDocs(collection(db, 'bugs'));
      for (const d of bugsSnap.docs) {
        const bData = d.data() as Bug;
        if (!bData.projectId || !validProjectIds.has(bData.projectId)) {
          orphanBugIds.add(d.id);
          deletePromises.push(deleteDoc(d.ref).catch(() => {}));
        }
      }

      // Test plans
      const plansSnap = await getDocs(collection(db, 'testPlans'));
      for (const d of plansSnap.docs) {
        const tpData = d.data() as TestPlan;
        if (!tpData.projectId || !validProjectIds.has(tpData.projectId)) {
          deletePromises.push(deleteDoc(d.ref).catch(() => {}));
        }
      }

      // Test cases
      const casesSnap = await getDocs(collection(db, 'testCases'));
      for (const d of casesSnap.docs) {
        const tcData = d.data() as TestCase;
        if (!tcData.projectId || !validProjectIds.has(tcData.projectId)) {
          deletePromises.push(deleteDoc(d.ref).catch(() => {}));
        }
      }

      // Test runs
      const runsSnap = await getDocs(collection(db, 'testRuns'));
      for (const d of runsSnap.docs) {
        const trData = d.data() as TestRun;
        if (!trData.projectId || !validProjectIds.has(trData.projectId)) {
          deletePromises.push(deleteDoc(d.ref).catch(() => {}));
        }
      }

      // Comments
      if (orphanBugIds.size > 0) {
        const commentsSnap = await getDocs(collection(db, 'comments'));
        for (const d of commentsSnap.docs) {
          const cData = d.data() as Comment;
          if (orphanBugIds.has(cData.entityId || cData.bugId || '')) {
            deletePromises.push(deleteDoc(d.ref).catch(() => {}));
          }
        }
      }

      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('Orphan cleanup warning:', err);
    }
  }
}

// One-time safe database initializer
let isSeedingProcessRunning = false;
async function ensureDatabaseInitialized() {
  if (!db || isSeedingProcessRunning) return;
  if (isAlreadySeeded()) return;

  try {
    isSeedingProcessRunning = true;
    const metaRef = doc(db, '_metadata', 'system_state');
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
      markSeeded();
      return;
    }

    // Check if any projects exist
    const projSnap = await getDocs(collection(db, 'projects'));
    if (!projSnap.empty) {
      markSeeded();
      await setDoc(metaRef, { seeded: true, updatedAt: new Date().toISOString() }, { merge: true });
      return;
    }

    // Brand new DB: seed initial demo state once
    for (const p of INITIAL_PROJECTS) {
      await setDoc(doc(db, 'projects', p.id), sanitizeForFirestore(p));
    }
    for (const b of INITIAL_BUGS) {
      await setDoc(doc(db, 'bugs', b.id), sanitizeForFirestore(b));
    }
    for (const tp of INITIAL_TEST_PLANS) {
      await setDoc(doc(db, 'testPlans', tp.id), sanitizeForFirestore(tp));
    }
    for (const tc of INITIAL_TEST_CASES) {
      await setDoc(doc(db, 'testCases', tc.id), sanitizeForFirestore(tc));
    }
    for (const tr of INITIAL_TEST_RUNS) {
      await setDoc(doc(db, 'testRuns', tr.id), sanitizeForFirestore(tr));
    }
    for (const c of INITIAL_COMMENTS) {
      await setDoc(doc(db, 'comments', c.id), sanitizeForFirestore(c));
    }
    for (const act of INITIAL_ACTIVITIES) {
      await setDoc(doc(db, 'activities', act.id), sanitizeForFirestore(act));
    }

    await setDoc(metaRef, { seeded: true, createdAt: new Date().toISOString() });
    markSeeded();
  } catch (err) {
    console.warn('Initial seeding verification:', err);
  } finally {
    isSeedingProcessRunning = false;
  }
}

// Run initial check
ensureDatabaseInitialized();

// ----------------- REAL-TIME SUBSCRIPTIONS -----------------

export function subscribeProjects(callback: (projects: Project[]) => void): () => void {
  projectListeners.add(callback);
  // 1. Emit local cache first for instant UX
  const cached = getLocalData<Project>(LS_KEYS.PROJECTS, INITIAL_PROJECTS);
  callback(cached);

  if (!db) {
    return () => { projectListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'projects');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const items = snapshot.docs.map(d => d.data() as Project);
      setLocalData(LS_KEYS.PROJECTS, items);
      notifyProjectListeners(items);
      if (items.length > 0) {
        cleanOrphanArtifacts(items).catch(() => {});
      }
    }, (error) => {
      console.warn('Projects snapshot error, using local fallback:', error);
      callback(getLocalData<Project>(LS_KEYS.PROJECTS, []));
    });

    return () => {
      projectListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { projectListeners.delete(callback); };
  }
}

export function subscribeBugs(callback: (bugs: Bug[]) => void): () => void {
  bugListeners.add(callback);
  const currentProjects = getLocalData<Project>(LS_KEYS.PROJECTS, []);
  const validProjectIds = new Set(currentProjects.map(p => p.id));
  const rawCached = getLocalData<Bug>(LS_KEYS.BUGS, INITIAL_BUGS);
  const cached = currentProjects.length > 0
    ? rawCached.filter(b => b.projectId && validProjectIds.has(b.projectId))
    : rawCached;
  callback(cached);

  if (!db) {
    return () => { bugListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'bugs');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const allItems = snapshot.docs.map(d => d.data() as Bug);
      const activeProjs = getLocalData<Project>(LS_KEYS.PROJECTS, []);
      const activeProjSet = new Set(activeProjs.map(p => p.id));
      
      const items = activeProjs.length > 0
        ? allItems.filter(b => b.projectId && activeProjSet.has(b.projectId))
        : allItems;

      setLocalData(LS_KEYS.BUGS, items);
      notifyBugListeners(items);
    }, (error) => {
      console.warn('Bugs snapshot error, using local fallback:', error);
      callback(getLocalData<Bug>(LS_KEYS.BUGS, []));
    });

    return () => {
      bugListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { bugListeners.delete(callback); };
  }
}

export function subscribeTestPlans(callback: (plans: TestPlan[]) => void): () => void {
  testPlanListeners.add(callback);
  const currentProjects = getLocalData<Project>(LS_KEYS.PROJECTS, []);
  const validProjectIds = new Set(currentProjects.map(p => p.id));
  const rawCached = getLocalData<TestPlan>(LS_KEYS.TEST_PLANS, INITIAL_TEST_PLANS);
  const cached = currentProjects.length > 0
    ? rawCached.filter(tp => tp.projectId && validProjectIds.has(tp.projectId))
    : rawCached;
  callback(cached);

  if (!db) {
    return () => { testPlanListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'testPlans');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const allItems = snapshot.docs.map(d => d.data() as TestPlan);
      const activeProjs = getLocalData<Project>(LS_KEYS.PROJECTS, []);
      const activeProjSet = new Set(activeProjs.map(p => p.id));

      const items = activeProjs.length > 0
        ? allItems.filter(tp => tp.projectId && activeProjSet.has(tp.projectId))
        : allItems;

      setLocalData(LS_KEYS.TEST_PLANS, items);
      notifyTestPlanListeners(items);
    }, (error) => {
      console.warn('Test plans snapshot error, using local fallback:', error);
      callback(getLocalData<TestPlan>(LS_KEYS.TEST_PLANS, []));
    });

    return () => {
      testPlanListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { testPlanListeners.delete(callback); };
  }
}

export function subscribeTestCases(callback: (cases: TestCase[]) => void): () => void {
  testCaseListeners.add(callback);
  const currentProjects = getLocalData<Project>(LS_KEYS.PROJECTS, []);
  const validProjectIds = new Set(currentProjects.map(p => p.id));
  const rawCached = getLocalData<TestCase>(LS_KEYS.TEST_CASES, INITIAL_TEST_CASES);
  const cached = currentProjects.length > 0
    ? rawCached.filter(tc => tc.projectId && validProjectIds.has(tc.projectId))
    : rawCached;
  callback(cached);

  if (!db) {
    return () => { testCaseListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'testCases');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const allItems = snapshot.docs.map(d => d.data() as TestCase);
      const activeProjs = getLocalData<Project>(LS_KEYS.PROJECTS, []);
      const activeProjSet = new Set(activeProjs.map(p => p.id));

      const items = activeProjs.length > 0
        ? allItems.filter(tc => tc.projectId && activeProjSet.has(tc.projectId))
        : allItems;

      setLocalData(LS_KEYS.TEST_CASES, items);
      notifyTestCaseListeners(items);
    }, (error) => {
      console.warn('Test cases snapshot error, using local fallback:', error);
      callback(getLocalData<TestCase>(LS_KEYS.TEST_CASES, []));
    });

    return () => {
      testCaseListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { testCaseListeners.delete(callback); };
  }
}

export function subscribeTestRuns(callback: (runs: TestRun[]) => void): () => void {
  testRunListeners.add(callback);
  const currentProjects = getLocalData<Project>(LS_KEYS.PROJECTS, []);
  const validProjectIds = new Set(currentProjects.map(p => p.id));
  const rawCached = getLocalData<TestRun>(LS_KEYS.TEST_RUNS, INITIAL_TEST_RUNS);
  const cached = currentProjects.length > 0
    ? rawCached.filter(tr => tr.projectId && validProjectIds.has(tr.projectId))
    : rawCached;
  callback(cached);

  if (!db) {
    return () => { testRunListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'testRuns');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const allItems = snapshot.docs.map(d => d.data() as TestRun);
      const activeProjs = getLocalData<Project>(LS_KEYS.PROJECTS, []);
      const activeProjSet = new Set(activeProjs.map(p => p.id));

      const items = activeProjs.length > 0
        ? allItems.filter(tr => tr.projectId && activeProjSet.has(tr.projectId))
        : allItems;

      setLocalData(LS_KEYS.TEST_RUNS, items);
      notifyTestRunListeners(items);
    }, (error) => {
      console.warn('Test runs snapshot error, using local fallback:', error);
      callback(getLocalData<TestRun>(LS_KEYS.TEST_RUNS, []));
    });

    return () => {
      testRunListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { testRunListeners.delete(callback); };
  }
}

export function subscribeActivities(callback: (acts: Activity[]) => void): () => void {
  activityListeners.add(callback);
  const cached = getLocalData<Activity>(LS_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  callback(cached);

  if (!db) {
    return () => { activityListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'activities');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const items = snapshot.docs
        .map(d => d.data() as Activity)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLocalData(LS_KEYS.ACTIVITIES, items);
      notifyActivityListeners(items);
    }, (error) => {
      console.warn('Activities snapshot error, using local fallback:', error);
      callback(getLocalData<Activity>(LS_KEYS.ACTIVITIES, []));
    });

    return () => {
      activityListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { activityListeners.delete(callback); };
  }
}

export function subscribeComments(callback: (comments: Comment[]) => void): () => void {
  commentListeners.add(callback);
  const cached = getLocalData<Comment>(LS_KEYS.COMMENTS, INITIAL_COMMENTS);
  callback(cached);

  if (!db) {
    return () => { commentListeners.delete(callback); };
  }

  try {
    const q = collection(db, 'comments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      markSeeded();
      const items = snapshot.docs.map(d => d.data() as Comment);
      setLocalData(LS_KEYS.COMMENTS, items);
      notifyCommentListeners(items);
    }, (error) => {
      console.warn('Comments snapshot error, using local fallback:', error);
      callback(getLocalData<Comment>(LS_KEYS.COMMENTS, []));
    });

    return () => {
      commentListeners.delete(callback);
      unsubscribe();
    };
  } catch {
    return () => { commentListeners.delete(callback); };
  }
}

// ----------------- MUTATION ACTIONS & DELETION CASCASE -----------------

// Log Activity
export async function logActivity(
  actionType: Activity['actionType'],
  entityType: Activity['entityType'],
  entityId: string,
  entityTitle: string,
  details: string,
  currentUser: TeamMember,
  projectId?: string
): Promise<Activity> {
  const newActivity: Activity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId: projectId || undefined,
    actionType,
    entityType,
    entityId,
    entityTitle,
    actorName: currentUser.name,
    actorRole: currentUser.role,
    timestamp: new Date().toISOString(),
    details,
  };

  const current = getLocalData<Activity>(LS_KEYS.ACTIVITIES, []);
  current.unshift(newActivity);
  if (current.length > 100) current.pop();
  setLocalData(LS_KEYS.ACTIVITIES, current);
  notifyActivityListeners(current);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(newActivity);
      await setDoc(doc(db, 'activities', newActivity.id), sanitized);
    } catch (e) {
      console.warn('Could not persist activity to Firestore:', e);
    }
  }

  return newActivity;
}

// Save Project
export async function saveProject(
  projectData: Partial<Project>,
  currentUser: TeamMember
): Promise<Project> {
  const currentList = getLocalData<Project>(LS_KEYS.PROJECTS, []);
  let saved: Project;

  if (projectData.id) {
    const existing = currentList.find(p => p.id === projectData.id);
    saved = {
      ...(existing || INITIAL_PROJECTS[0]),
      ...projectData,
      updatedAt: new Date().toISOString(),
    } as Project;
    const idx = currentList.findIndex(p => p.id === projectData.id);
    if (idx >= 0) currentList[idx] = saved;
    else currentList.push(saved);
  } else {
    saved = {
      id: `proj-${Date.now()}`,
      name: projectData.name || 'New Project',
      key: (projectData.key || 'QA').toUpperCase(),
      description: projectData.description || '',
      color: projectData.color || '#6366f1',
      lead: projectData.lead || currentUser.name,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentList.push(saved);
  }

  setLocalData(LS_KEYS.PROJECTS, currentList);
  notifyProjectListeners(currentList);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(saved);
      await setDoc(doc(db, 'projects', saved.id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Firestore saveProject error:', e);
    }
  }

  try {
    await logActivity(
      projectData.id ? 'updated' : 'created',
      'project',
      saved.id,
      saved.name,
      projectData.id ? `Updated project configuration` : `Initialized QA repository with prefix [${saved.key}]`,
      currentUser,
      saved.id
    );
  } catch {}

  return saved;
}

// Permanent Cascading Delete Project
export async function deleteProject(
  projectId: string,
  currentUser: TeamMember
): Promise<void> {
  // 1. Delete project from local store & notify
  const currentList = getLocalData<Project>(LS_KEYS.PROJECTS, []);
  const target = currentList.find(p => p.id === projectId);
  const nextList = currentList.filter(p => p.id !== projectId);
  setLocalData(LS_KEYS.PROJECTS, nextList);
  notifyProjectListeners(nextList);

  // 2. Cascade delete Bugs belonging to this project
  const currentBugs = getLocalData<Bug>(LS_KEYS.BUGS, []);
  const deletedBugIds = new Set(currentBugs.filter(b => b.projectId === projectId).map(b => b.id));
  const nextBugs = currentBugs.filter(b => b.projectId !== projectId);
  setLocalData(LS_KEYS.BUGS, nextBugs);
  notifyBugListeners(nextBugs);

  // 3. Cascade delete Test Plans
  const currentPlans = getLocalData<TestPlan>(LS_KEYS.TEST_PLANS, []);
  const nextPlans = currentPlans.filter(tp => tp.projectId !== projectId);
  setLocalData(LS_KEYS.TEST_PLANS, nextPlans);
  notifyTestPlanListeners(nextPlans);

  // 4. Cascade delete Test Cases
  const currentCases = getLocalData<TestCase>(LS_KEYS.TEST_CASES, []);
  const nextCases = currentCases.filter(tc => tc.projectId !== projectId);
  setLocalData(LS_KEYS.TEST_CASES, nextCases);
  notifyTestCaseListeners(nextCases);

  // 5. Cascade delete Test Runs
  const currentRuns = getLocalData<TestRun>(LS_KEYS.TEST_RUNS, []);
  const nextRuns = currentRuns.filter(tr => tr.projectId !== projectId);
  setLocalData(LS_KEYS.TEST_RUNS, nextRuns);
  notifyTestRunListeners(nextRuns);

  // 6. Cascade delete comments associated with deleted bugs
  const currentComments = getLocalData<Comment>(LS_KEYS.COMMENTS, []);
  const nextComments = currentComments.filter(c => !deletedBugIds.has(c.entityId || c.bugId || ''));
  setLocalData(LS_KEYS.COMMENTS, nextComments);
  notifyCommentListeners(nextComments);

  // 7. Permanent Firestore deep sync
  if (db) {
    try {
      // Delete project document
      await deleteDoc(doc(db, 'projects', projectId)).catch(() => {});

      const deletePromises: Promise<any>[] = [];

      // Query and delete all bugs under this project from Firestore
      const bugsQ = query(collection(db, 'bugs'), where('projectId', '==', projectId));
      const bugsSnap = await getDocs(bugsQ);
      for (const d of bugsSnap.docs) {
        deletedBugIds.add(d.id);
        deletePromises.push(deleteDoc(d.ref).catch(() => {}));
      }

      // Query and delete all test plans under this project from Firestore
      const plansQ = query(collection(db, 'testPlans'), where('projectId', '==', projectId));
      const plansSnap = await getDocs(plansQ);
      for (const d of plansSnap.docs) {
        deletePromises.push(deleteDoc(d.ref).catch(() => {}));
      }

      // Query and delete all test cases under this project from Firestore
      const casesQ = query(collection(db, 'testCases'), where('projectId', '==', projectId));
      const casesSnap = await getDocs(casesQ);
      for (const d of casesSnap.docs) {
        deletePromises.push(deleteDoc(d.ref).catch(() => {}));
      }

      // Query and delete all test runs under this project from Firestore
      const runsQ = query(collection(db, 'testRuns'), where('projectId', '==', projectId));
      const runsSnap = await getDocs(runsQ);
      for (const d of runsSnap.docs) {
        deletePromises.push(deleteDoc(d.ref).catch(() => {}));
      }

      // Query and delete comments matching deleted bug IDs from Firestore
      const commentsSnap = await getDocs(collection(db, 'comments'));
      for (const d of commentsSnap.docs) {
        const cData = d.data() as Comment;
        if (deletedBugIds.has(cData.entityId || cData.bugId || '')) {
          deletePromises.push(deleteDoc(d.ref).catch(() => {}));
        }
      }

      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('Firestore permanent cascading deleteProject error:', e);
    }
  }

  // Backend API sync
  api.deleteProject(projectId, currentUser.name).catch(() => {});

  if (target) {
    try {
      await logActivity(
        'deleted',
        'project',
        projectId,
        `[${target.key}] ${target.name}`,
        `Permanently deleted project and all child defects, test cases & plans`,
        currentUser,
        projectId
      );
    } catch {}
  }
}

// Save Bug
export async function saveBug(
  bugData: Partial<Bug>,
  projectKey: string,
  currentUser: TeamMember
): Promise<Bug> {
  const currentList = getLocalData<Bug>(LS_KEYS.BUGS, []);
  let saved: Bug;
  const isNew = !bugData.id;

  if (bugData.id) {
    const existing = currentList.find(b => b.id === bugData.id);
    saved = {
      ...(existing || INITIAL_BUGS[0]),
      ...bugData,
      updatedAt: new Date().toISOString(),
    } as Bug;
    const idx = currentList.findIndex(b => b.id === bugData.id);
    if (idx >= 0) {
      currentList[idx] = saved;
    } else {
      currentList.unshift(saved);
    }
  } else {
    const randomNum = Math.floor(Math.random() * 899 + 101);
    const resolvedProjKey = (projectKey && projectKey !== 'all' ? projectKey : 'QA').toUpperCase();
    saved = {
      id: `bug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bugNumber: `${resolvedProjKey}-${randomNum}`,
      projectId: bugData.projectId && bugData.projectId !== 'all' ? bugData.projectId : 'proj-1',
      title: bugData.title || 'Untitled Defect',
      description: bugData.description || '',
      stepsToReproduce: bugData.stepsToReproduce || '',
      expectedResult: bugData.expectedResult || '',
      actualResult: bugData.actualResult || '',
      severity: bugData.severity || 'high',
      priority: bugData.priority || 'P1',
      status: bugData.status || 'open',
      environment: bugData.environment || 'staging',
      reportedBy: bugData.reportedBy || currentUser.name,
      assignedTo: bugData.assignedTo || 'Elena Rostova',
      tags: bugData.tags && bugData.tags.length > 0 ? bugData.tags : ['defect'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (bugData.testPlanId) saved.testPlanId = bugData.testPlanId;
    if (bugData.testCaseId) saved.testCaseId = bugData.testCaseId;
    if (bugData.resolutionNotes) saved.resolutionNotes = bugData.resolutionNotes;
    if (bugData.reproductionUrl) saved.reproductionUrl = bugData.reproductionUrl;

    currentList.unshift(saved);
  }

  setLocalData(LS_KEYS.BUGS, currentList);
  notifyBugListeners(currentList);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(saved);
      await setDoc(doc(db, 'bugs', saved.id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Firestore saveBug error:', e);
    }
  }

  try {
    await logActivity(
      isNew ? 'created' : saved.status === 'resolved' ? 'resolved' : 'updated',
      'bug',
      saved.id,
      `[${saved.bugNumber}] ${saved.title}`,
      isNew 
        ? `Reported ${saved.severity} defect (${saved.priority}) assigned to ${saved.assignedTo}`
        : `Updated status to "${saved.status.replace('_', ' ')}"`,
      currentUser,
      saved.projectId
    );
  } catch (actErr) {
    console.warn('Could not log activity for saveBug:', actErr);
  }

  return saved;
}

// Delete Bug
export async function deleteBug(
  bugId: string,
  projectId: string | undefined,
  currentUser: TeamMember
): Promise<void> {
  const currentList = getLocalData<Bug>(LS_KEYS.BUGS, []);
  const target = currentList.find(b => b.id === bugId);
  const nextList = currentList.filter(b => b.id !== bugId);
  setLocalData(LS_KEYS.BUGS, nextList);
  notifyBugListeners(nextList);

  // Clean up associated comments
  const currentComments = getLocalData<Comment>(LS_KEYS.COMMENTS, []);
  const nextComments = currentComments.filter(c => c.entityId !== bugId && c.bugId !== bugId);
  setLocalData(LS_KEYS.COMMENTS, nextComments);
  notifyCommentListeners(nextComments);

  if (db) {
    try {
      await deleteDoc(doc(db, 'bugs', bugId));
      const commentsSnap = await getDocs(collection(db, 'comments'));
      for (const cDoc of commentsSnap.docs) {
        const cData = cDoc.data() as Comment;
        if (cData.entityId === bugId || cData.bugId === bugId) {
          await deleteDoc(cDoc.ref).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Firestore deleteBug error:', e);
    }
  }

  // Backend API sync
  api.deleteBug(bugId, currentUser.name).catch(() => {});

  if (target) {
    try {
      await logActivity(
        'deleted',
        'bug',
        bugId,
        `[${target.bugNumber}] ${target.title}`,
        `Deleted defect ticket`,
        currentUser,
        projectId
      );
    } catch {}
  }
}

// Save Comment
export async function saveComment(
  bugId: string,
  commentText: string,
  currentUser: TeamMember,
  projectId?: string
): Promise<Comment> {
  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    entityType: 'bug',
    entityId: bugId,
    bugId,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    authorAvatar: currentUser.avatarBg,
    content: commentText,
    createdAt: new Date().toISOString(),
  };

  const commentsList = getLocalData<Comment>(LS_KEYS.COMMENTS, []);
  commentsList.push(newComment);
  setLocalData(LS_KEYS.COMMENTS, commentsList);
  notifyCommentListeners(commentsList);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(newComment);
      await setDoc(doc(db, 'comments', newComment.id), sanitized);
    } catch {}
  }

  const bugList = getLocalData<Bug>(LS_KEYS.BUGS, []);
  const bug = bugList.find(b => b.id === bugId);

  try {
    await logActivity(
      'commented',
      'bug',
      bugId,
      `Comment on ${bug?.bugNumber || 'Defect'}`,
      commentText.length > 70 ? `${commentText.slice(0, 70)}...` : commentText,
      currentUser,
      projectId
    );
  } catch {}

  return newComment;
}

// Delete Comment
export async function deleteComment(
  commentId: string,
  currentUser: TeamMember
): Promise<void> {
  const currentList = getLocalData<Comment>(LS_KEYS.COMMENTS, []);
  const nextList = currentList.filter(c => c.id !== commentId);
  setLocalData(LS_KEYS.COMMENTS, nextList);
  notifyCommentListeners(nextList);

  if (db) {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (e) {
      console.warn('Firestore deleteComment error:', e);
    }
  }

  api.deleteComment(commentId, currentUser.name).catch(() => {});
}

// Save Test Plan
export async function saveTestPlan(
  planData: Partial<TestPlan>,
  projectKey: string,
  currentUser: TeamMember
): Promise<TestPlan> {
  const currentList = getLocalData<TestPlan>(LS_KEYS.TEST_PLANS, []);
  let saved: TestPlan;
  const isNew = !planData.id;

  if (planData.id) {
    const existing = currentList.find(p => p.id === planData.id);
    saved = {
      ...(existing || INITIAL_TEST_PLANS[0]),
      ...planData,
      updatedAt: new Date().toISOString(),
    } as TestPlan;
    const idx = currentList.findIndex(p => p.id === planData.id);
    if (idx >= 0) currentList[idx] = saved;
    else currentList.push(saved);
  } else {
    const randomNum = Math.floor(Math.random() * 89 + 10);
    const resolvedProjKey = (projectKey && projectKey !== 'all' ? projectKey : 'QA').toUpperCase();
    saved = {
      id: `tp-${Date.now()}`,
      planNumber: `${resolvedProjKey}-TP-${randomNum}`,
      projectId: planData.projectId && planData.projectId !== 'all' ? planData.projectId : 'proj-1',
      title: planData.title || 'Untitled Test Plan',
      description: planData.description || '',
      version: planData.version || 'v1.0.0',
      status: planData.status || 'active',
      startDate: planData.startDate || new Date().toISOString().slice(0, 10),
      endDate: planData.endDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      createdBy: currentUser.name,
      scope: planData.scope || '',
      objectives: planData.objectives || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentList.unshift(saved);
  }

  setLocalData(LS_KEYS.TEST_PLANS, currentList);
  notifyTestPlanListeners(currentList);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(saved);
      await setDoc(doc(db, 'testPlans', saved.id), sanitized, { merge: true });
    } catch {}
  }

  try {
    await logActivity(
      isNew ? 'created' : 'updated',
      'testPlan',
      saved.id,
      `[${saved.planNumber}] ${saved.title}`,
      isNew ? `Published test plan for ${saved.version}` : `Updated test plan configuration`,
      currentUser,
      saved.projectId
    );
  } catch {}

  return saved;
}

// Delete Test Plan
export async function deleteTestPlan(
  planId: string,
  projectId: string | undefined,
  currentUser: TeamMember
): Promise<void> {
  const currentList = getLocalData<TestPlan>(LS_KEYS.TEST_PLANS, []);
  const target = currentList.find(p => p.id === planId);
  const nextList = currentList.filter(p => p.id !== planId);
  setLocalData(LS_KEYS.TEST_PLANS, nextList);
  notifyTestPlanListeners(nextList);

  // Unlink child test cases
  const currentCases = getLocalData<TestCase>(LS_KEYS.TEST_CASES, []);
  let casesModified = false;
  const updatedCases = currentCases.map(tc => {
    if (tc.testPlanId === planId) {
      casesModified = true;
      const copy = { ...tc };
      delete copy.testPlanId;
      if (db) {
        setDoc(doc(db, 'testCases', tc.id), sanitizeForFirestore(copy), { merge: true }).catch(() => {});
      }
      return copy;
    }
    return tc;
  });
  if (casesModified) {
    setLocalData(LS_KEYS.TEST_CASES, updatedCases);
    notifyTestCaseListeners(updatedCases);
  }

  // Unlink bugs associated with this test plan
  const currentBugs = getLocalData<Bug>(LS_KEYS.BUGS, []);
  let bugsModified = false;
  const updatedBugs = currentBugs.map(b => {
    if (b.testPlanId === planId) {
      bugsModified = true;
      const copy = { ...b };
      delete copy.testPlanId;
      if (db) {
        setDoc(doc(db, 'bugs', b.id), sanitizeForFirestore(copy), { merge: true }).catch(() => {});
      }
      return copy;
    }
    return b;
  });
  if (bugsModified) {
    setLocalData(LS_KEYS.BUGS, updatedBugs);
    notifyBugListeners(updatedBugs);
  }

  if (db) {
    try {
      await deleteDoc(doc(db, 'testPlans', planId));
    } catch (e) {
      console.warn('Firestore deleteTestPlan error:', e);
    }
  }

  // Backend API sync
  api.deleteTestPlan(planId, currentUser.name).catch(() => {});

  if (target) {
    try {
      await logActivity(
        'deleted',
        'testPlan',
        planId,
        `[${target.planNumber}] ${target.title}`,
        `Deleted test plan`,
        currentUser,
        projectId
      );
    } catch {}
  }
}

// Save Test Case
export async function saveTestCase(
  caseData: Partial<TestCase>,
  projectKey: string,
  currentUser: TeamMember
): Promise<TestCase> {
  const currentList = getLocalData<TestCase>(LS_KEYS.TEST_CASES, []);
  let saved: TestCase;
  const isNew = !caseData.id;

  if (caseData.id) {
    const existing = currentList.find(c => c.id === caseData.id);
    saved = {
      ...(existing || INITIAL_TEST_CASES[0]),
      ...caseData,
      updatedAt: new Date().toISOString(),
    } as TestCase;
    const idx = currentList.findIndex(c => c.id === caseData.id);
    if (idx >= 0) currentList[idx] = saved;
    else currentList.push(saved);
  } else {
    const randomNum = Math.floor(Math.random() * 899 + 101);
    const resolvedProjKey = (projectKey && projectKey !== 'all' ? projectKey : 'QA').toUpperCase();
    saved = {
      id: `tc-${Date.now()}`,
      caseNumber: `${resolvedProjKey}-TC-${randomNum}`,
      projectId: caseData.projectId && caseData.projectId !== 'all' ? caseData.projectId : 'proj-1',
      title: caseData.title || 'Untitled Test Case',
      description: caseData.description || '',
      preconditions: caseData.preconditions || '',
      steps: caseData.steps || [{ stepNumber: 1, action: 'Run verification step', expectedResult: 'Criteria met' }],
      priority: caseData.priority || 'high',
      type: caseData.type || 'functional',
      status: caseData.status || 'untested',
      createdBy: currentUser.name,
      tags: caseData.tags || ['qa'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (caseData.testPlanId) saved.testPlanId = caseData.testPlanId;
    currentList.unshift(saved);
  }

  setLocalData(LS_KEYS.TEST_CASES, currentList);
  notifyTestCaseListeners(currentList);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(saved);
      await setDoc(doc(db, 'testCases', saved.id), sanitized, { merge: true });
    } catch {}
  }

  try {
    await logActivity(
      isNew ? 'created' : 'updated',
      'testCase',
      saved.id,
      `[${saved.caseNumber}] ${saved.title}`,
      isNew 
        ? `Authored ${saved.type} test case (${saved.priority})`
        : `Test case status updated to ${saved.status.toUpperCase()}`,
      currentUser,
      saved.projectId
    );
  } catch {}

  return saved;
}

// Delete Test Case
export async function deleteTestCase(
  caseId: string,
  projectId: string | undefined,
  currentUser: TeamMember
): Promise<void> {
  const currentList = getLocalData<TestCase>(LS_KEYS.TEST_CASES, []);
  const target = currentList.find(c => c.id === caseId);
  const nextList = currentList.filter(c => c.id !== caseId);
  setLocalData(LS_KEYS.TEST_CASES, nextList);
  notifyTestCaseListeners(nextList);

  // Unlink bugs linked to this test case
  const currentBugs = getLocalData<Bug>(LS_KEYS.BUGS, []);
  let bugsModified = false;
  const updatedBugs = currentBugs.map(b => {
    if (b.testCaseId === caseId) {
      bugsModified = true;
      const copy = { ...b };
      delete copy.testCaseId;
      if (db) {
        setDoc(doc(db, 'bugs', b.id), sanitizeForFirestore(copy), { merge: true }).catch(() => {});
      }
      return copy;
    }
    return b;
  });
  if (bugsModified) {
    setLocalData(LS_KEYS.BUGS, updatedBugs);
    notifyBugListeners(updatedBugs);
  }

  if (db) {
    try {
      await deleteDoc(doc(db, 'testCases', caseId));
    } catch (e) {
      console.warn('Firestore deleteTestCase error:', e);
    }
  }

  // Backend API sync
  api.deleteTestCase(caseId, currentUser.name).catch(() => {});

  if (target) {
    try {
      await logActivity(
        'deleted',
        'testCase',
        caseId,
        `[${target.caseNumber}] ${target.title}`,
        `Deleted test case`,
        currentUser,
        projectId
      );
    } catch {}
  }
}

// Save Test Run
export async function saveTestRun(
  run: TestRun,
  currentUser: TeamMember
): Promise<TestRun> {
  const currentList = getLocalData<TestRun>(LS_KEYS.TEST_RUNS, []);
  const idx = currentList.findIndex(r => r.id === run.id);
  if (idx >= 0) {
    currentList[idx] = run;
  } else {
    currentList.unshift(run);
  }
  setLocalData(LS_KEYS.TEST_RUNS, currentList);
  notifyTestRunListeners(currentList);

  if (db) {
    try {
      const sanitized = sanitizeForFirestore(run);
      await setDoc(doc(db, 'testRuns', run.id), sanitized, { merge: true });
    } catch {}
  }

  // Backend API sync
  api.saveTestRun(run, undefined, currentUser.name).catch(() => {});

  try {
    await logActivity(
      'executed',
      'testRun',
      run.id,
      `[${run.runNumber}] ${run.title}`,
      `Completed test run in ${run.environment}: ${run.passedCases}/${run.totalCases} passed (${run.failedCases} failed)`,
      currentUser,
      run.projectId
    );
  } catch {}

  return run;
}

// Delete Test Run
export async function deleteTestRun(
  runId: string,
  projectId: string | undefined,
  currentUser: TeamMember
): Promise<void> {
  const currentList = getLocalData<TestRun>(LS_KEYS.TEST_RUNS, []);
  const target = currentList.find(r => r.id === runId);
  const nextList = currentList.filter(r => r.id !== runId);
  setLocalData(LS_KEYS.TEST_RUNS, nextList);
  notifyTestRunListeners(nextList);

  if (db) {
    try {
      await deleteDoc(doc(db, 'testRuns', runId));
    } catch (e) {
      console.warn('Firestore deleteTestRun error:', e);
    }
  }

  // Backend API sync
  api.deleteTestRun(runId, currentUser.name).catch(() => {});

  if (target) {
    try {
      await logActivity(
        'deleted',
        'testRun',
        runId,
        `[${target.runNumber}] ${target.title}`,
        `Deleted test execution run`,
        currentUser,
        projectId
      );
    } catch {}
  }
}
