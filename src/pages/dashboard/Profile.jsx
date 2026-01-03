import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import useDashboardStore, { formatDate } from "../../store/useDashboardStore";
import profileService from "../../services/profileService";
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
import Select from "../../components/ui/Select";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Modal, { ModalActions } from "../../components/ui/Modal";
import { vehicleMakes, bodyTypes, yearOptions } from "../../data/vehicles";
import { cities, addressLabels } from "../../data/addresses";

const Profile = () => {
  const {
    user: storeUser,
    vehicles: storeVehicles,
    addresses: storeAddresses,
    bookings,
    updateUser: updateStoreUser,
    addToast,
  } = useDashboardStore();

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
  });
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);

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

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    whatsapp: true,
  });

  // Fetch profile data from API
  useEffect(() => {
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
          setNotifications(
            mappedUser.notificationPreferences || {
              email: true,
              sms: false,
              whatsapp: true,
            }
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
        console.error("Error fetching profile:", error);
        addToast({ type: "error", message: "Failed to load profile data" });
        // Fall back to store data
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

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
        phone: editForm.phone,
        preferredContact: editForm.preferredContact,
      };

      const res = await profileService.updateProfile(updateData);
      if (res.success) {
        const mappedUser = mapUser(res.data);
        setUser(mappedUser);
        updateStoreUser(mappedUser);
        setIsEditing(false);
        addToast({ type: "success", message: "Profile updated successfully" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      addToast({ type: "error", message: "Failed to update profile" });
    } finally {
      setIsSaving(false);
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
      });
    } else {
      setVehicleForm({
        make: "",
        model: "",
        year: "",
        bodyType: "Sedan",
        registration: "",
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
      };

      let res;
      if (vehicleModal.vehicle) {
        res = await profileService.updateVehicle(
          vehicleModal.vehicle.id,
          vehicleData
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
      console.error("Error saving vehicle:", error);
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
          isDefault: v.isDefault,
        }));
        setVehicles(mappedVehicles);
        addToast({ type: "success", message: "Vehicle removed" });
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
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
    setAddressModal({ open: true, address });
  };

  const handleSaveAddress = async () => {
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
          addressData
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
      console.error("Error saving address:", error);
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
      console.error("Error deleting address:", error);
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
      await profileService.updateProfile({
        notificationPreferences: newNotifications,
      });
      updateStoreUser({ notificationPreferences: newNotifications });
    } catch (error) {
      console.error("Error updating notifications:", error);
      // Revert on error
      setNotifications(notifications);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        actionLabel={isEditing ? undefined : "Edit Profile"}
        actionIcon={Edit2}
        onAction={handleEditProfile}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex flex-col items-center">
                <Avatar
                  name={
                    user.name ||
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    "User"
                  }
                  size="xl"
                />
                <Button variant="ghost" size="sm" className="mt-2">
                  Change Photo
                </Button>
              </div>

              {isEditing ? (
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Last Name"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    helperText="Changing email will require verification"
                    disabled
                  />
                  <Input
                    label="Mobile"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Preferred Contact
                    </label>
                    <div className="flex gap-4">
                      {["whatsapp", "phone", "email"].map((method) => (
                        <label
                          key={method}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            checked={editForm.preferredContact === method}
                            onChange={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                preferredContact: method,
                              }))
                            }
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm text-slate-700 capitalize">
                            {method}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : null}
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {user?.name ||
                        `${user?.firstName || ""} ${
                          user?.lastName || ""
                        }`.trim() ||
                        "User"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Member since {formatDate(user?.memberSince)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-slate-700">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-slate-700">
                        {user?.phone || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MessageSquare size={16} className="text-slate-400" />
                      <span className="text-slate-700 capitalize">
                        Preferred: {user?.preferredContact || "whatsapp"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-slate-700">
                        {totalBookings} total bookings
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Saved Vehicles */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Saved Vehicles</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Save your vehicles for faster quoting
                </p>
              </div>
              <Button size="sm" onClick={() => openVehicleModal()}>
                <Plus size={16} />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Car size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    No vehicles saved yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Car size={20} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-slate-500">
                            {vehicle.bodyType}
                            {vehicle.registration &&
                              ` · ${vehicle.registration}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openVehicleModal(vehicle)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteVehicleId(vehicle.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Addresses */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Saved Addresses</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Save addresses for quicker booking
                </p>
              </div>
              <Button size="sm" onClick={() => openAddressModal()}>
                <Plus size={16} />
                Add Address
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <MapPin size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    No addresses saved yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <MapPin size={20} className="text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {address.label}
                            </p>
                            {address.isDefault && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {address.street}, {address.suburb}, {address.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddressModal(address)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteAddressId(address.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={18} />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "email",
                  label: "Email notifications",
                  description: "Quotes, bookings, receipts",
                },
                {
                  key: "sms",
                  label: "SMS notifications",
                  description: "Important updates only",
                },
                {
                  key: "whatsapp",
                  label: "WhatsApp notifications",
                  description: "Real-time updates",
                },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {label}
                    </p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(key)}
                    className={`
                      relative w-11 h-6 rounded-full transition-colors
                      ${notifications[key] ? "bg-primary-600" : "bg-slate-200"}
                    `}
                  >
                    <span
                      className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${notifications[key] ? "left-6" : "left-1"}
                    `}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={18} />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start"
                size="sm"
              >
                Change Password
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                size="sm"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/dashboard/bookings"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLink size={14} />
                View booking history
              </a>
              <a
                href="/dashboard/quotes/new"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLink size={14} />
                Request a quote
              </a>
              <a
                href="/dashboard/support"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLink size={14} />
                Get help
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicle Modal */}
      <Modal
        isOpen={vehicleModal.open}
        onClose={() => setVehicleModal({ open: false, vehicle: null })}
        title={vehicleModal.vehicle ? "Edit Vehicle" : "Add Vehicle"}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Make"
            options={vehicleMakes}
            value={vehicleForm.make}
            onChange={(e) =>
              setVehicleForm((prev) => ({ ...prev, make: e.target.value }))
            }
            required
          />
          <Input
            label="Model"
            placeholder="e.g., Corolla"
            value={vehicleForm.model}
            onChange={(e) =>
              setVehicleForm((prev) => ({ ...prev, model: e.target.value }))
            }
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Year"
              options={yearOptions.map((y) => ({ value: y, label: y }))}
              value={vehicleForm.year}
              onChange={(e) =>
                setVehicleForm((prev) => ({ ...prev, year: e.target.value }))
              }
              required
            />
            <Select
              label="Body Type"
              options={bodyTypes}
              value={vehicleForm.bodyType}
              onChange={(e) =>
                setVehicleForm((prev) => ({
                  ...prev,
                  bodyType: e.target.value,
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
          <Select
            label="Label"
            options={addressLabels}
            value={addressForm.label}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, label: e.target.value }))
            }
          />
          <Input
            label="Street Address"
            placeholder="123 Main Road"
            value={addressForm.street}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, street: e.target.value }))
            }
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Suburb/Area"
              placeholder="e.g., Sandton"
              value={addressForm.suburb}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, suburb: e.target.value }))
              }
              required
            />
            <Select
              label="City"
              options={cities}
              value={addressForm.city}
              onChange={(e) =>
                setAddressForm((prev) => ({ ...prev, city: e.target.value }))
              }
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
    </div>
  );
};

export default Profile;
