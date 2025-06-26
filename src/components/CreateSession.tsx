import React, { useState } from 'react';
import { Plus, X, Calendar, Clock, FileText, MapPin, BookOpen, Loader, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAttendance } from '../hooks/useSupabaseAttendance';
import { locationService } from '../services/location';

interface CreateSessionProps {
  onSuccess?: () => void;
}

export const CreateSession: React.FC<CreateSessionProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    startTime: '',
    endTime: '',
    date: '',
    location: {
      latitude: 0,
      longitude: 0,
      address: ''
    },
    allowedRadius: 50,
    checkInWindow: 10,
    excuseDeadlineHours: 48
  });

  const { createSession, isLoading, error, loadData } = useSupabaseAttendance();

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      const address = await locationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      
      setFormData(prev => ({
        ...prev,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address
        }
      }));
    } catch (error) {
      console.error('Failed to get location:', error);
      alert(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.latitude || !formData.location.longitude) {
      alert('Please get your current location before creating the session');
      return;
    }
    
    try {
      const startTime = new Date(`${formData.date}T${formData.startTime}`);
      const endTime = new Date(`${formData.date}T${formData.endTime}`);

      await createSession({
        courseCode: formData.courseCode,
        courseName: formData.courseName,
        description: formData.description,
        startTime,
        endTime,
        isActive: true,
        createdBy: 'current-user',
        location: formData.location,
        declarationTime: new Date(),
        allowedRadius: formData.allowedRadius,
        checkInWindow: formData.checkInWindow,
        excuseDeadlineHours: formData.excuseDeadlineHours
      });

      // Reload data to show the new session
      await loadData();

      setFormData({
        courseCode: '',
        courseName: '',
        description: '',
        startTime: '',
        endTime: '',
        date: '',
        location: {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        allowedRadius: 50,
        checkInWindow: 10,
        excuseDeadlineHours: 48
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus size={18} />
        Declare Class Session
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isLoading && setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto border border-gray-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-black" />
                  <h2 className="text-lg font-medium text-black">Declare Class Session</h2>
                </div>
                <button
                  onClick={() => !isLoading && setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                      <BookOpen size={14} />
                      Course Code
                    </label>
                    <input
                      type="text"
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., MATH101"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                      <FileText size={14} />
                      Course Name
                    </label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Mathematics"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                    <Calendar size={14} />
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                      <Clock size={14} />
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                      <MapPin size={14} />
                      Radius (m)
                    </label>
                    <input
                      type="number"
                      name="allowedRadius"
                      value={formData.allowedRadius}
                      onChange={handleNumberChange}
                      min="10"
                      max="500"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                      <Clock size={14} />
                      Window (min)
                    </label>
                    <input
                      type="number"
                      name="checkInWindow"
                      value={formData.checkInWindow}
                      onChange={handleNumberChange}
                      min="5"
                      max="60"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                      <FileText size={14} />
                      Excuse (hrs)
                    </label>
                    <input
                      type="number"
                      name="excuseDeadlineHours"
                      value={formData.excuseDeadlineHours}
                      onChange={handleNumberChange}
                      min="12"
                      max="168"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                    <MapPin size={14} />
                    Class Location
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin size={14} />
                          Get Current Location
                        </>
                      )}
                    </button>
                    {formData.location.address && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-black">
                          <strong>Location:</strong> {formData.location.address}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Veracity Check Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                    <Shield size={14} />
                    Veracity Checks Enabled
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      GPS location verification within {formData.allowedRadius}m radius
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Check-in window: {formData.checkInWindow} minutes from start time
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Excuse deadline: {formData.excuseDeadlineHours} hours after class ends
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Duplicate attendance prevention
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                      Wallet-based identity verification
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                    className="btn-secondary flex-1 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.location.latitude}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {isLoading ? 'Declaring...' : 'Declare Session'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};