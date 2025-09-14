import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissionFlow } from '@/hooks/usePermissionFlow';
import { AlertCircle, Settings, Shield } from 'lucide-react';

interface PermissionWindowProps {
  onPermissionGranted: () => void;
  onPermissionRevoked?: () => void;
  onError?: (error: string) => void;
}

export function PermissionWindow({ onPermissionGranted, onPermissionRevoked, onError }: PermissionWindowProps) {
  const { 
    isGranted, 
    isLoading, 
    error, 
    retryCount,
    openSystemSettings, 
    retryPermissionCheck,
    resetError 
  } = usePermissionFlow();

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Handle permission granted
  React.useEffect(() => {
    if (isGranted) {
      onPermissionGranted();
    }
  }, [isGranted, onPermissionGranted]);

  // Handle permission revocation (for requirement 3.4)
  const wasGrantedRef = React.useRef(false);
  React.useEffect(() => {
    if (wasGrantedRef.current && !isGranted && !isLoading) {
      // Permission was previously granted but is now revoked
      if (onPermissionRevoked) {
        onPermissionRevoked();
      }
    }
    wasGrantedRef.current = isGranted;
  }, [isGranted, isLoading, onPermissionRevoked]);

  // Handle errors
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleOpenSettings = async () => {
    resetError();
    await openSystemSettings();
  };

  // Focus management - focus the main button when component mounts
  React.useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, []);

  // Keyboard support
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isLoading) {
        event.preventDefault();
        void handleOpenSettings();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading]);

  return (
    <div >
      <Card  role="dialog" aria-labelledby="permission-title" aria-describedby="permission-description">
        <CardHeader >
          <div  aria-hidden="true">
            <Shield  />
          </div>
          <CardTitle id="permission-title" >Accessibility Permission Required</CardTitle>
        </CardHeader>
        
        <CardContent >
          {/* Main explanation */}
          <div id="permission-description" >
            <p >
              DotDash needs accessibility permission to detect when you type your custom shortcuts and automatically expand them with your saved text.
            </p>
            <p >
              This permission allows the app to work seamlessly in any application on your Mac.
            </p>
          </div>

          {/* Privacy and security reassurance */}
          <div >
            <div  role="note" aria-label="Privacy and security information">
              <div >
                <Shield  aria-hidden="true" />
                <div >
                  <p >Your Privacy is Protected</p>
                  <div >
                    <p>• Your keystrokes are never logged, recorded, or stored</p>
                    <p>• Only your custom shortcuts are saved locally on your device</p>
                    <p>• No data is transmitted to external servers or services</p>
                    <p>• You maintain complete control over your shortcuts and data</p>
                  </div>
                </div>
              </div>
            </div>

            <div  role="note" aria-label="How it works">
              <div >
                <Settings  aria-hidden="true" />
                <div >
                  <p >How DotDash Works</p>
                  <p >
                    The app only monitors for your specific shortcut patterns (like ".email" or ".addr") and replaces them with your saved text. Everything else you type is completely ignored.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div 
               
              role="alert" 
              aria-live="polite"
              aria-label="Error message"
            >
              <div >
                <AlertCircle  aria-hidden="true" />
                <div >
                  <p >
                    {error.includes('attempt') ? 'Checking Permissions' : 'Unable to Open Settings'}
                  </p>
                  <p >
                    {error}
                  </p>
                  {!error.includes('attempt') && (
                    <>
                      <p >
                        You can manually open System Settings → Privacy & Security → Accessibility
                      </p>
                      {retryCount >= 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryPermissionCheck}
                          
                          aria-label="Retry permission check"
                        >
                          Try Again
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div >
            <Button 
              ref={buttonRef}
              onClick={handleOpenSettings}
              disabled={isLoading}
              
              size="lg"
              aria-describedby="button-help-text"
            >
              <Settings  aria-hidden="true" />
              {isLoading ? 'Opening Settings...' : 'Open System Settings'}
            </Button>
            
            <p id="button-help-text" >
              After enabling the permission, this window will automatically close
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PermissionWindow;