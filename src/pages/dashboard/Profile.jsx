import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Car,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Bell,
  Shield,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Lock,
  ChevronRight,
  Star,
  LogOut,
} from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { ProfileSkeleton } from "../../components/skeletons/ProfileSkeleton";
import useDashboardStore, { formatDate } from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import profileService from "../../services/profileService";
import { NodeURL } from "../../services/api";
import vehicleService from "../../services/vehicleService";
import { mapUser } from "../../utils/dataMappers";
import PageHeader from "../../components/ui/PageHeader";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import Input from "../../components/ui/Input";
import PremiumSelect from "../../components/ui/PremiumSelect";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Modal, { ModalActions } from "../../components/ui/Modal";
import { bodyTypes, yearOptions } from "../../data/vehicles";
import { addressLabels } from "../../data/addresses";
import { CITIES as cities } from "../../data/cities";

const Profile = () => {
  const {
    user: storeUser,
    vehicles: storeVehicles,
    addresses: storeAddresses,
    bookings,
    updateUser: updateStoreUser,
    addToast,
  } = useDashboardStore();

  // Get AuthStore for session persistence
  const { user: authUser, setUser: setAuthUser } = useAuthStore();

  // API Data state
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(storeUser);
  const [vehicles, setVehicles] = useState(storeVehicles);
  const [addresses, setAddresses] = useState(storeAddresses);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredContact: "whatsapp",
  });

  // Vehicle modal state
  const [vehicleModal, setVehicleModal] = useState({
    open: false,
    vehicle: null,
  });
  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    bodyType: "Sedan",
    registration: "",
    hasAdasCamera: false,
    hasRainSensor: false,
  });
  const [availableModels, setAvailableModels] = useState([]);
  const [availableMakes, setAvailableMakes] = useState([]);
  const [makeLookup, setMakeLookup] = useState({}); // name → _id
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingMakes, setIsFetchingMakes] = useState(false);
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);

  // Fetch makes on mount — map to name strings and build lookup
  useEffect(() => {
    const fetchMakes = async () => {
      setIsFetchingMakes(true);
      try {
        const makes = await vehicleService.getAllMakes();
        if (makes && makes.length > 0) {
          const nameStrings = makes.map((m) => m.name);
          const lookup = {};
          makes.forEach((m) => { lookup[m.name] = m._id; });
          setAvailableMakes(nameStrings);
          setMakeLookup(lookup);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingMakes(false);
      }
    };
    fetchMakes();
  }, []);

  // Address modal state
  const [addressModal, setAddressModal] = useState({
    open: false,
    address: null,
  });
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    street: "",
    suburb: "",
    city: "Johannesburg",
    postalCode: "",
    isDefault: false,
  });
  const [deleteAddressId, setDeleteAddressId] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    whatsapp: true,
  });

  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Delete account state
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  // Avatar upload state
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, vehiclesRes, addressesRes] = await Promise.all([
        profileService.getProfile(),
        profileService.getVehicles(),
        profileService.getAddresses(),
      ]);

      if (profileRes.success && profileRes.data) {
        const mappedUser = mapUser(profileRes.data);
        setUser(mappedUser);
        updateStoreUser(mappedUser);
        setAuthUser(profileRes.data); // Sync with auth store
        setNotifications(
          mappedUser.notificationPreferences || {
            email: true,
            sms: false,
            whatsapp: true,
          },
        );
      }

      if (vehiclesRes.success) {
        // Map vehicle data from API format
        const mappedVehicles = (vehiclesRes.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          hasAdasCamera: v.hasAdasCamera || false,
          hasRainSensor: v.hasRainSensor || false,
          isDefault: v.isDefault,
        }));
        setVehicles(mappedVehicles);
      }

      if (addressesRes.success) {
        // Map address data from API format
        const mappedAddresses = (addressesRes.data || []).map((a) => ({
          id: a._id,
          label: a.label || "Home",
          street: a.addressLine1,
          suburb: a.suburb || "",
          city: a.city,
          postalCode: a.postalCode || "",
          isDefault: a.isDefault,
        }));
        setAddresses(mappedAddresses);
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to load profile data" });
      // Fall back to store/auth data if available
      if (authUser) {
        const mappedUser = mapUser(authUser);
        setUser(mappedUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch models dynamically for vehicle form — use _id from lookup when available
  useEffect(() => {
    const fetchModels = async () => {
      if (!vehicleForm.make) return;
      setIsFetchingModels(true);
      try {
        const makeIdOrName = makeLookup[vehicleForm.make] || vehicleForm.make;
        const models = await vehicleService.getModelsByMake(makeIdOrName);
        setAvailableModels(models.map((m) => m.name));
      } catch (err) {
        setAvailableModels([]);
      } finally {
        setIsFetchingModels(false);
      }
    };

    fetchModels();
  }, [vehicleForm.make, makeLookup]);

  const totalBookings = bookings.length;

  // Profile editing
  const handleEditProfile = () => {
    const nameParts = (user?.name || "").split(" ");
    setEditForm({
      firstName: user?.firstName || nameParts[0] || "",
      lastName: user?.lastName || nameParts.slice(1).join(" ") || "",
      email: user?.email || "",
      phone: user?.phone || "",
      preferredContact: user?.preferredContact || "whatsapp",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        name: `${editForm.firstName} ${editForm.lastName}`.trim(),
        phone: editForm.phone.replace(/\s+/g, ""),
        preferredContact: editForm.preferredContact,
      };

      // Only include email if it was changed
      if (editForm.email !== user?.email) {
        updateData.email = editForm.email.trim().toLowerCase();
      }

      const res = await profileService.updateProfile(updateData);
      if (res.success) {
        const mappedUser = mapUser(res.data);

        // Update local state
        setUser(mappedUser);

        // Update dashboard store
        updateStoreUser(mappedUser);

        // Update AuthStore to persist session data
        setAuthUser(res.data);

        // Also update localStorage for auth
        const storedAuth = localStorage.getItem("autoscreen-auth");
        if (storedAuth) {
          try {
            const authData = JSON.parse(storedAuth);
            authData.state.user = res.data;
            localStorage.setItem("autoscreen-auth", JSON.stringify(authData));
          } catch (e) {}
        }

        setIsEditing(false);
        addToast({ type: "success", message: "Profile updated successfully" });
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB for avatar)
    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: "error", message: "Avatar must be less than 2MB" });
      return;
    }

    setUploadingAvatar(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("profileImage", file);

      // Upload to server
      const res = await profileService.uploadProfileImage(formData);

      if (res.success) {
        // Backend returns profileImage path like /uploads/profiles/filename.jpg
        const imageUrl = `${NodeURL}${res.data.profileImage}`;

        // Backend returns profileImage, map to avatar for frontend
        const updatedUser = {
          ...authUser,
          profileImage: res.data.profileImage,
          avatar: imageUrl,
        };

        // Update all stores and persistence
        setUser((prev) => ({
          ...prev,
          avatar: imageUrl,
          profileImage: res.data.profileImage,
        }));
        updateStoreUser({
          avatar: imageUrl,
          profileImage: res.data.profileImage,
        });
        setAuthUser(updatedUser);

        // Re-fetch profile to get updated data from server
        await fetchProfileData();

        addToast({
          type: "success",
          message: "Profile photo updated successfully",
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        message: error.message || "Failed to update profile photo",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Vehicle management
  const openVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setVehicleForm({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        bodyType: vehicle.bodyType,
        registration: vehicle.registration || "",
        hasAdasCamera: vehicle.hasAdasCamera || false,
        hasRainSensor: vehicle.hasRainSensor || false,
      });
    } else {
      setVehicleForm({
        make: "",
        model: "",
        year: "",
        bodyType: "Sedan",
        registration: "",
        hasAdasCamera: false,
        hasRainSensor: false,
      });
    }
    setVehicleModal({ open: true, vehicle });
  };

  const handleSaveVehicle = async () => {
    setIsSaving(true);
    try {
      const vehicleData = {
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: parseInt(vehicleForm.year),
        bodyType: vehicleForm.bodyType,
        registrationNumber: vehicleForm.registration,
        hasAdasCamera: vehicleForm.hasAdasCamera,
        hasRainSensor: vehicleForm.hasRainSensor,
      };

      let res;
      if (vehicleModal.vehicle) {
        res = await profileService.updateVehicle(
          vehicleModal.vehicle.id,
          vehicleData,
        );
      } else {
        res = await profileService.addVehicle(vehicleData);
      }

      if (res.success) {
        // Refresh vehicles list
        const mappedVehicles = (res.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          isDefault: v.isDefault,
        }));
        setVehicles(mappedVehicles);
        setVehicleModal({ open: false, vehicle: null });
        addToast({
          type: "success",
          message: vehicleModal.vehicle ? "Vehicle updated" : "Vehicle added",
        });
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to save vehicle" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVehicle = async () => {
    setIsSaving(true);
    try {
      const res = await profileService.deleteVehicle(deleteVehicleId);
      if (res.success) {
        const mappedVehicles = (res.data || []).map((v) => ({
          id: v._id,
          make: v.make,
          model: v.model,
          year: v.year,
          bodyType: v.bodyType || "Sedan",
          registration: v.registrationNumber || "",
          hasAdasCamera: v.hasAdasCamera || false,
          hasRainSensor: v.hasRainSensor || false,
          isDefault: v.isDefault,
        }));
        setVehicles(mappedVehicles);
        addToast({ type: "success", message: "Vehicle removed" });
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to remove vehicle" });
    } finally {
      setDeleteVehicleId(null);
      setIsSaving(false);
    }
  };

  // Address management
  const openAddressModal = (address = null) => {
    if (address) {
      setAddressForm({
        label: address.label,
        street: address.street,
        suburb: address.suburb,
        city: address.city,
        postalCode: address.postalCode,
        isDefault: address.isDefault,
      });
    } else {
      setAddressForm({
        label: "Home",
        street: "",
        suburb: "",
        city: "Johannesburg",
        postalCode: "",
        isDefault: false,
      });
    }
    setAddressErrors({});
    setAddressModal({ open: true, address });
  };

  const handleSaveAddress = async () => {
    const newErrors = {};
    if (!addressForm.street?.trim()) newErrors.street = "Street address is required";
    if (!addressForm.city?.trim()) newErrors.city = "City is required";
    if (Object.keys(newErrors).length > 0) {
      setAddressErrors(newErrors);
      return;
    }
    setAddressErrors({});
    setIsSaving(true);
    try {
      const addressData = {
        label: addressForm.label,
        addressLine1: addressForm.street,
        suburb: addressForm.suburb,
        city: addressForm.city,
        postalCode: addressForm.postalCode,
        isDefault: addressForm.isDefault,
      };

      let res;
      if (addressModal.address) {
        res = await profileService.updateAddress(
          addressModal.address.id,
          addressData,
        );
      } else {
        res = await profileService.addAddress(addressData);
      }

      if (res.success) {
        const mappedAddresses = (res.data || []).map((a) => ({
          id: a._id,
          label: a.label || "Home",
          street: a.addressLine1,
          suburb: a.suburb || "",
          city: a.city,
          postalCode: a.postalCode || "",
          isDefault: a.isDefault,
        }));
        setAddresses(mappedAddresses);
        setAddressModal({ open: false, address: null });
        addToast({
          type: "success",
          message: addressModal.address ? "Address updated" : "Address added",
        });
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to save address" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async () => {
    setIsSaving(true);
    try {
      const res = await profileService.deleteAddress(deleteAddressId);
      if (res.success) {
        const mappedAddresses = (res.data || []).map((a) => ({
          id: a._id,
          label: a.label || "Home",
          street: a.addressLine1,
          suburb: a.suburb || "",
          city: a.city,
          postalCode: a.postalCode || "",
          isDefault: a.isDefault,
        }));
        setAddresses(mappedAddresses);
        addToast({ type: "success", message: "Address removed" });
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to remove address" });
    } finally {
      setDeleteAddressId(null);
      setIsSaving(false);
    }
  };

  // Notification toggle
  const toggleNotification = async (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);

    try {
      const res = await profileService.updateProfile({
        notificationPreferences: newNotifications,
      });

      if (res.success) {
        updateStoreUser({ notificationPreferences: newNotifications });

        // Update AuthStore
        const updatedUser = {
          ...authUser,
          notificationPreferences: newNotifications,
        };
        setAuthUser(updatedUser);

        addToast({ type: "success", message: "Preferences updated" });
      }
    } catch (error) {
      // Revert on error
      setNotifications(notifications);
      addToast({ type: "error", message: "Failed to update preferences" });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({ type: "error", message: "Passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      addToast({
        type: "error",
        message: "Password must be at least 8 characters",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.success) {
        setPasswordModal(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        addToast({ type: "success", message: "Password changed successfully" });
      }
    } catch (error) {
      addToast({
        type: "error",
        message: error.message || "Failed to change password",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      const res = await profileService.deleteAccount();
      if (res.success) {
        addToast({ type: "success", message: "Account deleted successfully" });
        // Redirect to login or logout
        const logout = useAuthStore.getState().logout;
        await logout();
      }
    } catch (error) {
      addToast({ type: "error", message: "Failed to delete account" });
    } finally {
      setIsSaving(false);
      setDeleteAccountModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-full max-w-md space-y-4 text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  // Derived display values
  const displayName =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "User";
  const displayEmail = user?.email || "";
  const displayPhone = user?.phone || "Not set";
  const displayContact = user?.preferredContact || "whatsapp";
  const memberSince = user?.memberSince
    ? formatDate(user.memberSince)
    : "Recently joined";

  // Initials for gradient avatar
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">
      {/* Page Header */}
      <div className="pt-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Account settings and preferences
        </p>
      </div>

      {/* Gradient Profile Header Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 flex items-center gap-6 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, var(--tw-gradient-stops))",
          backgroundImage:
            "linear-gradient(135deg, #1e3a5f 0%, #0f1e35 100%)",
        }}
      >
        {/* Decorative circle */}
        <div
          className="pointer-events-none absolute"
          style={{
            right: "-60px",
            top: "-60px",
            width: "220px",
            height: "220px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "50%",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            left: "-40px",
            bottom: "-80px",
            width: "180px",
            height: "180px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "50%",
          }}
        />

        {/* Avatar — clickable for photo upload */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative focus:outline-none group"
            title="Change profile photo"
            disabled={uploadingAvatar}
          >
            <div
              className="w-18 h-18 rounded-full ring-3 ring-white/30 overflow-hidden flex items-center justify-center"
              style={{ width: 72, height: 72 }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  }}
                >
                  {uploadingAvatar ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    initials
                  )}
                </div>
              )}
            </div>
            {/* Upload overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit2 size={16} className="text-white" />
            </div>
          </button>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Name / Email / Member badge */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white leading-tight truncate">
            {displayName}
          </h2>
          <p className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
            {displayEmail}
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
          >
            <Star size={11} className="fill-amber-300 text-amber-300" />
            Member since {memberSince}
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Personal Information
          </h3>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="animate-spin mr-1.5" size={13} />}
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={handleEditProfile}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
              />
              <Input
                label="Last Name"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input
              label="Mobile"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>
        ) : (
          <div>
            {/* Full Name */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Full Name</p>
                  <p className="text-[13px] text-slate-400 dark:text-slate-500">{displayName}</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Phone Number</p>
                  <p className="text-[13px] text-slate-400 dark:text-slate-500">{displayPhone}</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Email Address</p>
                  <p className="text-[13px] text-slate-400 dark:text-slate-500">{displayEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insurance Details Section */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        onClick={() => addToast({ type: "info", message: "Insurance management coming soon!" })}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Insurance Details
          </h3>
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
            Manage &rarr;
          </span>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Insurance</p>
              <p className="text-[13px] text-slate-400 dark:text-slate-500">Manage your insurance details</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        </div>
      </div>

      {/* Saved Addresses Section (extra — not in reference HTML) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Saved Addresses
          </h3>
          <button
            onClick={() => openAddressModal()}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <Plus size={13} />
            Add
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-10 px-5">
            <div className="w-11 h-11 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <MapPin size={20} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No addresses saved yet
            </p>
          </div>
        ) : (
          <div>
            {addresses.map((address, idx) => (
              <div
                key={address.id}
                className={`flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                  idx < addresses.length - 1
                    ? "border-b border-slate-100 dark:border-slate-800"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">
                        {address.label}
                      </p>
                      {address.isDefault && (
                        <span className="text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-400 dark:text-slate-500 truncate">
                      {[address.street, address.suburb, address.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openAddressModal(address)}
                    className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit address"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteAddressId(address.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    title="Remove address"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Preferences
          </h3>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Notifications</p>
              <p className="text-[13px] text-slate-400 dark:text-slate-500">Quote alerts, booking reminders</p>
            </div>
          </div>
          <span className="text-[15px] font-semibold text-green-600 dark:text-green-400">On</span>
        </div>

      </div>

      {/* Account Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
            Account
          </h3>
        </div>

        {/* Saved Payment Methods */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <CreditCard size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Saved Payment Methods</p>
              <p className="text-[13px] text-slate-400 dark:text-slate-500">Paystack</p>
            </div>
          </div>
        </div>

        {/* Save Card */}
        <button
          type="button"
          onClick={() => addToast({ type: "info", message: "Save card feature coming soon!" })}
          className="w-full flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Save Card for Faster Payments</p>
              <p className="text-[13px] text-slate-400 dark:text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Shield size={11} className="text-green-500" />
                  Secured by Paystack &middot; PCI DSS compliant
                </span>
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        </button>

        {/* Sign Out */}
        <button
          type="button"
          onClick={async () => {
            addToast({ type: "info", message: "Logging out..." });
            sessionStorage.removeItem("action_banner_dismissed");
            sessionStorage.removeItem("dismissed_completed_bookings");
            const { logout } = useAuthStore.getState();
            await logout();
          }}
          className="w-full flex items-center gap-3.5 px-6 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <LogOut size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-[15px] font-medium text-red-600 dark:text-red-400">Sign Out</p>
        </button>
      </div>

      {/* Vehicle Modal */}
      <Modal
        isOpen={vehicleModal.open}
        onClose={() => setVehicleModal({ open: false, vehicle: null })}
        title={vehicleModal.vehicle ? "Edit Vehicle" : "Add Vehicle"}
        size="md"
      >
        <div className="space-y-4">
          <PremiumSelect
            label="Make"
            options={availableMakes}
            value={vehicleForm.make}
            onChange={(val) => {
              setVehicleForm((prev) => ({
                ...prev,
                make: val,
                model: "",
              }));
              setAvailableModels([]);
              // If not in existing makes list it is a user-created entry
              if (val && !availableMakes.includes(val)) {
                vehicleService.createMake(val).then((created) => {
                  if (created?._id) {
                    setAvailableMakes((prev) =>
                      prev.includes(val) ? prev : [...prev, val],
                    );
                    setMakeLookup((prev) => ({ ...prev, [val]: created._id }));
                  }
                }).catch(() => {});
              }
            }}
            required
            isSearchable
            isCreatable
            isClearable
            loading={isFetchingMakes}
            placeholder="Select make"
          />
          <PremiumSelect
            label="Model"
            options={availableModels}
            value={vehicleForm.model}
            onChange={(val) => {
              setVehicleForm((prev) => ({ ...prev, model: val }));
              // If not in existing models list it is a user-created entry
              if (val && !availableModels.includes(val) && vehicleForm.make) {
                const makeIdOrName = makeLookup[vehicleForm.make] || vehicleForm.make;
                vehicleService.createModel(makeIdOrName, val).then(() => {
                  setAvailableModels((prev) =>
                    prev.includes(val) ? prev : [...prev, val],
                  );
                }).catch(() => {});
              }
            }}
            required
            isSearchable
            isCreatable
            isClearable
            disabled={!vehicleForm.make}
            loading={isFetchingModels}
            placeholder={
              !vehicleForm.make ? "Select make first" : "Search or select model"
            }
            emptyMessage={
              !vehicleForm.make
                ? "Please select a make first"
                : "No models found"
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <PremiumSelect
              label="Year"
              options={yearOptions.map(String)}
              value={vehicleForm.year?.toString() || ""}
              onChange={(val) =>
                setVehicleForm((prev) => ({ ...prev, year: val }))
              }
              required
            />
            <PremiumSelect
              label="Body Type"
              options={bodyTypes}
              value={vehicleForm.bodyType}
              onChange={(val) =>
                setVehicleForm((prev) => ({
                  ...prev,
                  bodyType: val,
                }))
              }
            />
          </div>
          <Input
            label="Registration (optional)"
            placeholder="e.g., CA 123-456"
            value={vehicleForm.registration}
            onChange={(e) =>
              setVehicleForm((prev) => ({
                ...prev,
                registration: e.target.value,
              }))
            }
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={vehicleForm.hasAdasCamera}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    hasAdasCamera: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ADAS Camera
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={vehicleForm.hasRainSensor}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    hasRainSensor: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Rain Sensor
              </span>
            </label>
          </div>
        </div>
        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => setVehicleModal({ open: false, vehicle: null })}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveVehicle} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            {vehicleModal.vehicle ? "Save Changes" : "Add Vehicle"}
          </Button>
        </ModalActions>
      </Modal>

      {/* Address Modal */}
      <Modal
        isOpen={addressModal.open}
        onClose={() => setAddressModal({ open: false, address: null })}
        title={addressModal.address ? "Edit Address" : "Add Address"}
        size="md"
      >
        <div className="space-y-4">
          <PremiumSelect
            label="Label"
            options={addressLabels}
            value={addressForm.label}
            onChange={(val) =>
              setAddressForm((prev) => ({ ...prev, label: val }))
            }
          />
          <Input
            label="Street Address"
            placeholder="123 Main Road"
            value={addressForm.street}
            onChange={(e) => {
              setAddressForm((prev) => ({ ...prev, street: e.target.value }));
              setAddressErrors((prev) => ({ ...prev, street: '' }));
            }}
            required
            error={addressErrors.street}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Suburb/Area (optional)"
              placeholder="e.g., Sandton"
              value={addressForm.suburb}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, suburb: e.target.value }))
              }
            />
            <PremiumSelect
              label="City"
              options={cities}
              value={addressForm.city}
              onChange={(val) => {
                setAddressForm((prev) => ({ ...prev, city: val }));
                setAddressErrors((prev) => ({ ...prev, city: '' }));
              }}
              searchable
              error={addressErrors.city}
            />
          </div>
          <Input
            label="Postal Code"
            placeholder="e.g., 2196"
            value={addressForm.postalCode}
            onChange={(e) =>
              setAddressForm((prev) => ({
                ...prev,
                postalCode: e.target.value,
              }))
            }
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) =>
                setAddressForm((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }))
              }
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm text-slate-700">
              Set as default address
            </span>
          </label>
        </div>
        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => setAddressModal({ open: false, address: null })}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveAddress} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            {addressModal.address ? "Save Changes" : "Add Address"}
          </Button>
        </ModalActions>
      </Modal>

      {/* Delete Vehicle Confirmation */}
      <ConfirmModal
        isOpen={!!deleteVehicleId}
        onClose={() => setDeleteVehicleId(null)}
        onConfirm={handleDeleteVehicle}
        title="Remove this vehicle?"
        message="This won't affect existing quotes or bookings."
        confirmLabel="Remove"
        cancelLabel="Keep"
        type="danger"
      />

      {/* Delete Address Confirmation */}
      <ConfirmModal
        isOpen={!!deleteAddressId}
        onClose={() => setDeleteAddressId(null)}
        onConfirm={handleDeleteAddress}
        title="Remove this address?"
        message="This won't affect existing bookings."
        confirmLabel="Remove"
        cancelLabel="Keep"
        type="danger"
      />

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModal}
        onClose={() => setPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            required
            helperText="At least 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            required
          />
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setPasswordModal(false)}>
            Cancel
          </Button>
          <Button onClick={handlePasswordChange} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
            Update Password
          </Button>
        </ModalActions>
      </Modal>

      {/* Delete Account Confirmation */}
      <ConfirmModal
        isOpen={deleteAccountModal}
        onClose={() => setDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        message="This action is permanent and cannot be undone. All your data, including quotes and history, will be removed."
        confirmLabel="Delete Everything"
        cancelLabel="No, keep my account"
        type="danger"
      />
    </div>
  );
};

export default Profile;
