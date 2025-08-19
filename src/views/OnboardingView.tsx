import { PermissionWindow } from "@/components/PermissionWindow";

export default function OnboardingView({ onContinue }: { onContinue: () => void }) {
  const handlePermissionGranted = () => {
    onContinue();
  };

  const handlePermissionRevoked = () => {
    // Permission was revoked, stay on the permission screen
    // The PermissionWindow will automatically show again
  };

  const handleError = (error: string) => {
    // Error handling is managed by the PermissionWindow component
    // We could add additional logging here if needed
    console.warn('Permission flow error:', error);
  };

  return (
    <PermissionWindow
      onPermissionGranted={handlePermissionGranted}
      onPermissionRevoked={handlePermissionRevoked}
      onError={handleError}
    />
  );
}


