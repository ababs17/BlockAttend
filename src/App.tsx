import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Blocks, Shield, Clock, MapPin, User } from 'lucide-react';
import { WalletConnect } from './components/WalletConnect';
import { RoleSelector } from './components/RoleSelector';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { UserProfileSetup } from './components/UserProfileSetup';
import { TestNetStatus } from './components/TestNetStatus';
import { useWallet } from './hooks/useWallet';
import { useUserProfile } from './hooks/useUserProfile';
import { useAttendance } from './hooks/useAttendance';

function App() {
  const { isConnected, account } = useWallet();
  const { userProfile, hasProfile, createProfile, loadProfile, isLoading: profileLoading, error: profileError, resetAll } = useUserProfile();
  const { 
    sessions, 
    records, 
    excuses, 
    recordAttendance, 
    getSessionRecords, 
    getSessionExcuses, 
    getStudentExcuses,
    getCourseAttendanceSummary,
    isTestNet
  } = useAttendance();

  // Reset everything when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      resetAll();
    }
  }, [isConnected, resetAll]);

  // Load user profile when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      loadProfile(account);
    }
  }, [isConnected, account, loadProfile]);

  const handleAttendanceMarking = async (sessionId: string) => {
    try {
      await recordAttendance(sessionId);
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert(error instanceof Error ? error.message : 'Failed to mark attendance');
    }
  };

  const handleProfileComplete = async (profile: any) => {
    try {
      await createProfile(profile);
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to create profile');
    }
  };

  const hasAttended = (sessionId: string, studentAddress: string) => {
    return records.some(record => 
      record.sessionId === sessionId && record.studentAddress === studentAddress
    );
  };

  const studentExcuses = account ? getStudentExcuses(account) : [];
  const allExcuses = userProfile?.role === 'teacher' ? excuses : studentExcuses;
  const courseSummaries = account ? getCourseAttendanceSummary(account) : [];

  // Show loading state while checking profile
  if (isConnected && account && profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-4 bg-black rounded-2xl mb-4">
            <Blocks className="text-white animate-pulse" size={32} />
          </div>
          <h2 className="text-lg font-medium text-black mb-2">Loading your profile...</h2>
          <p className="text-gray-600">Please wait while we fetch your information</p>
          {profileError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto">
              <p className="font-medium">Profile Error</p>
              <p>{profileError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show profile setup if wallet is connected but no profile exists
  if (isConnected && account && !hasProfile(account) && !profileLoading) {
    return (
      <UserProfileSetup
        walletAddress={account}
        onProfileComplete={handleProfileComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-lg">
                <Blocks className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black">BlockAttend</h1>
                <p className="text-xs text-gray-500">
                  TestNet Only • Blockchain Attendance System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isConnected && userProfile && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span>{userProfile.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      userProfile.verified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {userProfile.verified ? 'Verified' : 'Demo Mode'}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">
                      {userProfile.role}
                    </span>
                  </div>
                  <RoleSelector 
                    selectedRole={userProfile.role} 
                    onRoleChange={() => {}} // Role is fixed after profile creation
                  />
                </>
              )}
              
              {/* TestNet Status */}
              {isConnected && <TestNetStatus />}
              
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!isConnected ? (
          /* Welcome Screen - Always show this when wallet is not connected */
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="inline-flex p-4 bg-black rounded-2xl mb-8">
                <Blocks className="text-white" size={40} />
              </div>
              <h1 className="text-4xl font-semibold text-black mb-4 tracking-tight">
                Welcome to BlockAttend
              </h1>
              <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                A revolutionary blockchain-based attendance tracking system built on Algorand. 
                Secure, transparent, and tamper-proof attendance records with GPS verification and excuse management.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6 text-center"
              >
                <Shield className="text-black mb-4 mx-auto" size={28} />
                <h3 className="text-base font-medium text-black mb-2">Secure & Immutable</h3>
                <p className="text-sm text-gray-600 leading-relaxed">All attendance records are stored on the Algorand blockchain, ensuring they cannot be tampered with.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6 text-center"
              >
                <Clock className="text-black mb-4 mx-auto" size={28} />
                <h3 className="text-base font-medium text-black mb-2">Real-time Tracking</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Track attendance in real-time with instant blockchain confirmation and verification.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6 text-center"
              >
                <MapPin className="text-black mb-4 mx-auto" size={28} />
                <h3 className="text-base font-medium text-black mb-2">GPS Verified</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Location-based verification ensures students are physically present at the declared class location.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-6 text-center"
              >
                <Blocks className="text-black mb-4 mx-auto" size={28} />
                <h3 className="text-base font-medium text-black mb-2">Profile Management</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Comprehensive user profiles with institutional verification and role-based access control.</p>
              </motion.div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">Connect your Algorand wallet to begin using BlockAttend</p>
              <WalletConnect />
            </div>

            <div className="text-sm text-gray-500 max-w-md mx-auto">
              <p className="mb-2">
                <strong>New to Algorand?</strong> You'll need an Algorand wallet like Pera Wallet to get started.
              </p>
              <p>
                After connecting, you'll set up your profile as either a student or teacher.
              </p>
            </div>
          </div>
        ) : userProfile?.role === 'student' ? (
          /* Student Dashboard */
          <StudentDashboard 
            account={account!}
            userProfile={userProfile}
            sessions={sessions}
            records={records}
            excuses={studentExcuses}
            courseSummaries={courseSummaries}
            onMarkAttendance={handleAttendanceMarking}
            hasAttended={hasAttended}
          />
        ) : (
          /* Teacher Dashboard */
          <TeacherDashboard 
            account={account!}
            userProfile={userProfile!}
            sessions={sessions}
            records={records}
            excuses={allExcuses}
            courseSummaries={courseSummaries}
            getSessionRecords={getSessionRecords}
            getSessionExcuses={getSessionExcuses}
          />
        )}
      </main>
    </div>
  );
}

export default App;