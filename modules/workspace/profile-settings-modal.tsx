'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/modules/core/types';
import { authService } from '@/modules/auth/auth.service';
import UserAvatar from '@/modules/core/user-avatar';
import {
  X,
  Camera,
  Upload,
  Trash2,
  User as UserIcon,
  Mail,
  Briefcase,
  Phone,
  FileText,
  Smile,
  Lock,
  Check,
  Loader2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onProfileUpdated: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#3f3f46"/></linearGradient></defs><rect width="120" height="120" fill="url(#g1)"/><circle cx="60" cy="45" r="22" fill="#fafafa"/><path d="M24 108c4-22 22-34 36-34s32 12 36 34" fill="#fafafa"/></svg>'
  )}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><rect width="120" height="120" fill="url(#g2)"/><circle cx="60" cy="45" r="22" fill="#eff6ff"/><path d="M24 108c4-22 22-34 36-34s32 12 36 34" fill="#eff6ff"/></svg>'
  )}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#047857"/></linearGradient></defs><rect width="120" height="120" fill="url(#g3)"/><circle cx="60" cy="45" r="22" fill="#ecfdf5"/><path d="M24 108c4-22 22-34 36-34s32 12 36 34" fill="#ecfdf5"/></svg>'
  )}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#5b21b6"/></linearGradient></defs><rect width="120" height="120" fill="url(#g4)"/><circle cx="60" cy="45" r="22" fill="#f5f3ff"/><path d="M24 108c4-22 22-34 36-34s32 12 36 34" fill="#f5f3ff"/></svg>'
  )}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ea580c"/><stop offset="100%" stop-color="#c2410c"/></linearGradient></defs><rect width="120" height="120" fill="url(#g5)"/><circle cx="60" cy="45" r="22" fill="#fff7ed"/><path d="M24 108c4-22 22-34 36-34s32 12 36 34" fill="#fff7ed"/></svg>'
  )}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#db2777"/><stop offset="100%" stop-color="#be185d"/></linearGradient></defs><rect width="120" height="120" fill="url(#g6)"/><circle cx="60" cy="45" r="22" fill="#fdf2f8"/><path d="M24 108c4-22 22-34 36-34s32 12 36 34" fill="#fdf2f8"/></svg>'
  )}`,
];

const STATUS_PRESETS = [
  '🟢 Available',
  '💻 Focusing',
  '📅 In a meeting',
  '🚀 Shipping code',
  '🌴 Out of office',
];

function compressImageFile(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [statusText, setStatusText] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setUsername(currentUser.username || '');
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setTitle(currentUser.title || '');
      setStatusText(currentUser.statusText || '');
      setBio(currentUser.bio || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
      setCustomAvatarUrl(
        currentUser.avatar && currentUser.avatar.startsWith('http')
          ? currentUser.avatar
          : ''
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    try {
      const dataUrl = await compressImageFile(file, 256);
      setAvatar(dataUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to process image file'
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyAvatarUrl = () => {
    if (!customAvatarUrl.trim()) return;
    setAvatar(customAvatarUrl.trim());
    setShowUrlInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (activeTab === 'security' || newPassword) {
      if (newPassword && newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
      if (newPassword && !currentPassword) {
        setError('Please enter your current password to set a new password.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        avatar,
        title: title.trim(),
        statusText: statusText.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        ...(newPassword
          ? { currentPassword, newPassword }
          : {}),
      });

      onProfileUpdated(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Profile updated successfully!');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-[10px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-zinc-950 text-white flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950">
                Edit Your Profile
              </h2>
              <p className="text-[11px] text-zinc-500">
                Customize your profile photo, display name, status, and account security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-2 border-b border-zinc-200 bg-white flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setError(null);
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile & Photo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setError(null);
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-zinc-950 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <>
              {/* Profile Picture Section */}
              <div className="p-4 rounded-[8px] bg-[#fafafa] border border-zinc-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <UserAvatar
                        name={displayName || username}
                        avatar={avatar}
                        size="xl"
                        variant="dark"
                        isOnline={true}
                        showStatusDot={true}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload new photo"
                        className="absolute inset-0 rounded-[8px] bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-950">
                        Profile Picture
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Upload a photo from your device, paste an image URL, or pick an avatar preset.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="px-2.5 py-1.5 rounded-[6px] bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Image URL</span>
                        </button>
                        {avatar && (
                          <button
                            type="button"
                            onClick={() => setAvatar('')}
                            className="px-2.5 py-1.5 rounded-[6px] bg-white hover:bg-red-50 text-red-600 border border-zinc-200 hover:border-red-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {showUrlInput && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center gap-2">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://example.com/your-avatar.png"
                      className="flex-1 px-3 py-1.5 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                    />
                    <button
                      type="button"
                      onClick={handleApplyAvatarUrl}
                      className="px-3 py-1.5 rounded-[6px] bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Preset Avatars */}
                <div className="mt-3 pt-3 border-t border-zinc-200">
                  <div className="text-[11px] font-mono text-zinc-500 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Quick Avatar Presets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((preset, idx) => {
                      const isSelected = avatar === preset;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`w-8 h-8 rounded-[6px] overflow-hidden border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-zinc-950 scale-105 shadow-sm'
                              : 'border-transparent hover:border-zinc-300'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset}
                            alt={`Preset ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Name & Username Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-mono text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                </div>
              </div>

              {/* Role/Title & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Job Title / Role
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior Systems Architect"
                      className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Current Status
                </label>
                <div className="relative">
                  <Smile className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="What are you working on?"
                    className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {STATUS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStatusText(preset)}
                      className={`px-2 py-1 rounded-[4px] text-[11px] border transition-colors cursor-pointer ${
                        statusText === preset
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-[#fafafa] hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Bio / About Me
                </label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a short bio, timezone, or what teams you work with..."
                    className="w-full pl-8 pr-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950 resize-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-[6px] bg-[#fafafa] border border-zinc-200 text-xs text-zinc-600">
                Leave these fields blank if you do not wish to change your password.
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-950 focus:outline-none focus:border-zinc-950"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-[6px] bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-[6px] bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

