import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { AuthCard } from './AuthCard';

const AuthContent = ({ children }) => {
  const { authStatus, user, signOut } = useAuthenticator((context) => [context.authStatus, context.user, context.signOut]);

  if (authStatus === 'configuring') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <span className="spinner" style={{ width: '30px', height: '30px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <AuthCard />;
  }

  return children({ signOut, user });
};

export const AuthWrapper = ({ children }) => {
  return (
    <Authenticator.Provider>
      <AuthContent>
        {children}
      </AuthContent>
    </Authenticator.Provider>
  );
};
