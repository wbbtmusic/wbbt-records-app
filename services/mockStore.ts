import { User, Release, ReleaseStatus, UserRole, ApplicationStatus, EarningsRecord, ArtistApplication, ReleaseArtist } from '../types';
import { MOCK_ADMIN, MOCK_USER, MOCK_RELEASES } from '../constants';

class MockStore {
  private users: User[] = [MOCK_ADMIN, MOCK_USER];
  private releases: Release[] = [...MOCK_RELEASES];
  private applications: ArtistApplication[] = [];
  private currentUser: User | null = null;

  constructor() {
    // Add a mock pending user
    const pendingUser: User = {
        id: 'pending-1',
        email: 'newbie@example.com',
        firstName: 'Alex',
        lastName: 'Smith',
        artistName: 'Lil New',
        role: UserRole.USER,
        isBanned: false,
        applicationStatus: ApplicationStatus.PENDING,
        balance: 0
    };
    this.users.push(pendingUser);
    this.applications.push({
        userId: 'pending-1',
        bio: 'I make experimental hyper-pop with AI tools.',
        instagramUrl: 'instagram.com/lilnew',
        demoTrackUrl: 'soundcloud.com/lilnew/demo',
        submissionDate: '2023-11-20'
    });
  }

  login(email: string, password: string): User {
    const user = this.users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    if (user.isBanned) throw new Error(`Account suspended. Reason: ${user.banReason}`);
    
    // Simple password check for demo
    if (email === 'support@wbbt.net' && password !== 'WBBTRecords340') {
        throw new Error('Invalid credentials');
    }
    
    this.currentUser = user;
    return user;
  }

  signup(email: string, password: string, firstName: string, lastName: string, artistName: string): User {
    if (this.users.find(u => u.email === email)) {
        throw new Error('User already exists with this email');
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        firstName,
        lastName,
        artistName,
        role: UserRole.USER,
        isBanned: false,
        applicationStatus: ApplicationStatus.NOT_APPLIED, // Start as not applied
        balance: 0
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    return newUser;
  }

  submitApplication(userId: string, data: Omit<ArtistApplication, 'userId' | 'submissionDate'>) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    this.applications.push({
        userId,
        ...data,
        submissionDate: new Date().toISOString().split('T')[0]
    });
    user.applicationStatus = ApplicationStatus.PENDING;
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Release Management
  getReleases(userId?: string): Release[] {
    if (userId) return this.releases.filter(r => r.userId === userId);
    return this.releases;
  }

  createRelease(release: Release) {
    this.releases.push(release);
  }

  updateReleaseStatus(id: string, status: ReleaseStatus, reason?: string) {
    const r = this.releases.find(rel => rel.id === id);
    if (r) {
      r.status = status;
      if (reason) r.rejectionReason = reason;
    }
  }

  getEarnings(userId: string): EarningsRecord[] {
    return [
      { month: '2023-10', amount: 120.50, streams: 45000, downloads: 12 },
      { month: '2023-11', amount: 340.00, streams: 120000, downloads: 45 },
      { month: '2023-12', amount: 280.75, streams: 98000, downloads: 22 },
      { month: '2024-01', amount: 450.25, streams: 160000, downloads: 60 },
    ];
  }

  // Artist Memory / Library
  // Scans existing releases to find unique artists and their IDs
  getArtistLibrary(userId: string): ReleaseArtist[] {
      const userReleases = this.releases.filter(r => r.userId === userId);
      const artistMap = new Map<string, ReleaseArtist>();

      // Add the main user profile first
      const currentUser = this.users.find(u => u.id === userId);
      if(currentUser) {
          artistMap.set(currentUser.artistName.toLowerCase(), {
              id: currentUser.id,
              name: currentUser.artistName,
              role: 'Primary Artist'
          });
      }

      userReleases.forEach(r => {
          r.tracks.forEach(t => {
              t.artists.forEach(a => {
                  if (!artistMap.has(a.name.toLowerCase())) {
                      artistMap.set(a.name.toLowerCase(), a);
                  }
              });
          });
      });

      return Array.from(artistMap.values());
  }

  // Admin functions
  getAllUsers() {
    return this.users;
  }

  getPendingApplications() {
    return this.applications.filter(app => {
        const user = this.users.find(u => u.id === app.userId);
        return user && user.applicationStatus === ApplicationStatus.PENDING;
    }).map(app => {
        const user = this.users.find(u => u.id === app.userId)!;
        return { ...app, user };
    });
  }

  reviewApplication(userId: string, approved: boolean) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
        user.applicationStatus = approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;
    }
  }

  banUser(userId: string, reason: string) {
    const u = this.users.find(user => user.id === userId);
    if (u) {
      u.isBanned = true;
      u.banReason = reason;
    }
  }
}

export const mockStore = new MockStore();
