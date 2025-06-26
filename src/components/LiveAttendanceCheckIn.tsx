import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Loader,
  Shield,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceSession } from '../types';
import { locationService } from '../services/location';

interface LiveAttendanceCheckInProps {
  session: AttendanceSession;
  onMarkAttendance: (sessionId: string) => Promise<void>;
  currentTime: Date;
}

export const LiveAttendanceCheckIn: React.FC<LiveAttendanceCheckInProps> = ({
  session,
  onMarkAttendance,
  currentTime
}) => {
  const [locationStatus, setLocationStatus] = useState<'checking' | 'in-range' | 'out-of-range' | 'error'>('checking');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isMarking, setIsMarking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const checkInDeadline = new Date(session.startTime.getTime() + (session.checkInWindow * 60 * 1000));

  useEffect(() => {
    const remaining = Math.max(0, checkInDeadline.getTime() - currentTime.getTime());
    setTimeRemaining(remaining);
  }, [currentTime, checkInDeadline]);

  useEffect(() => {
    let watchId: number | null = null;

    const startLocationTracking = async () => {
      try {
        setLocationStatus('checking');
        
        // Get initial location
        const location = await locationService.getCurrentLocation();
        setUserLocation(location);
        
        // Calculate distance
        const dist = locationService.calculateDistance(
          location.latitude,
          location.longitude,
          session.location.latitude,
          session.location.longitude
        );
        setDistance(Math.round(dist));
        
        // Set status based on distance
        if (dist <= session.allowedRadius) {
          setLocationStatus('in-range');
        } else {
          setLocationStatus('out-of-range');
        }

        // Start watching location for real-time updates
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setUserLocation(newLocation);
            
            const newDist = locationService.calculateDistance(
              newLocation.latitude,
              newLocation.longitude,
              session.location.latitude,
              session.location.longitude
            );
            setDistance(Math.round(newDist));
            
            if (newDist <= session.allowedRadius) {
              setLocationStatus('in-range');
            } else {
              setLocationStatus('out-of-range');
            }
          },
          (error) => {
            console.error('Location watch error:', error);
            setLocationStatus('error');
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000
          }
        );
      } catch (error) {
        console.error('Failed to get location:', error);
        setLocationStatus('error');
      }
    };

    startLocationTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [session.location, session.allowedRadius]);

  const handleMarkAttendance = async () => {
    if (locationStatus !== 'in-range' || timeRemaining <= 0) return;
    
    setIsMarking(true);
    try {
      await onMarkAttendance(session.id);
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'checking':
        return <Loader size={16} className="text-blue-600 animate-spin" />;
      case 'in-range':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'out-of-range':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-600" />;
    }
  };

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'checking':
        return 'Checking location...';
      case 'in-range':
        return `You are within range (${distance}m away)`;
      case 'out-of-range':
        return `You are too far (${distance}m away, max ${session.allowedRadius}m)`;
      case 'error':
        return 'Location access required';
    }
  };

  const getLocationStatusColor = () => {
    switch (locationStatus) {
      case 'checking':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'in-range':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'out-of-range':
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  const canMarkAttendance = locationStatus === 'in-range' && timeRemaining > 0 && !isMarking;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6 border-2 border-orange-200 bg-orange-50"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-orange-600" />
            <span className="text-sm font-medium text-orange-600">LIVE CHECK-IN</span>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-black mb-1">
            {session.courseCode} - {session.courseName}
          </h3>
          <p className="text-gray-600 text-sm">
            {session.description}
          </p>
        </div>
        
        {/* Timer */}
        <div className="text-right">
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-600">TIME LEFT</span>
            </div>
            <div className="text-xl font-mono font-bold text-black">
              {formatTimeRemaining(timeRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-600">SESSION TIME</span>
          </div>
          <div className="text-sm font-medium text-black">
            {format(session.startTime, 'HH:mm')} - {format(session.endTime, 'HH:mm')}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-600">CHECK-IN WINDOW</span>
          </div>
          <div className="text-sm font-medium text-black">
            {session.checkInWindow} minutes
          </div>
        </div>
      </div>

      {/* Location Status */}
      <div className={`rounded-lg p-3 border mb-4 ${getLocationStatusColor()}`}>
        <div className="flex items-center gap-2 mb-2">
          {getLocationStatusIcon()}
          <span className="text-sm font-medium">GPS Location Status</span>
        </div>
        <p className="text-sm">{getLocationStatusText()}</p>
        
        {userLocation && (
          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
            <button
              onClick={() => {
                const url = `https://www.google.com/maps?q=${session.location.latitude},${session.location.longitude}`;
                window.open(url, '_blank');
              }}
              className="text-xs underline hover:no-underline"
            >
              View class location on map
            </button>
          </div>
        )}
      </div>

      {/* Mark Attendance Button */}
      <motion.button
        whileHover={canMarkAttendance ? { scale: 1.02 } : {}}
        whileTap={canMarkAttendance ? { scale: 0.98 } : {}}
        onClick={handleMarkAttendance}
        disabled={!canMarkAttendance}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          canMarkAttendance
            ? 'bg-black text-white hover:bg-gray-800'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isMarking ? (
          <>
            <Loader size={18} className="animate-spin" />
            Recording Attendance...
          </>
        ) : canMarkAttendance ? (
          <>
            <CheckCircle size={18} />
            Mark Attendance
          </>
        ) : timeRemaining <= 0 ? (
          'Check-in Window Closed'
        ) : locationStatus === 'out-of-range' ? (
          'Move Closer to Class Location'
        ) : locationStatus === 'error' ? (
          'Enable Location Access'
        ) : (
          'Checking Location...'
        )}
      </motion.button>

      {/* Verification Info */}
      <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={12} className="text-gray-600" />
          <span className="text-xs font-medium text-gray-600">VERIFICATION REQUIREMENTS</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${locationStatus === 'in-range' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>GPS within {session.allowedRadius}m</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${timeRemaining > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Within time window</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};