import { useEffect, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

/**
 * Hook to check if the current user is an organization administrator.
 * @returns boolean indicating if the user is an org admin
 */
export const useIsOrgAdmin = () => {
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { auth } = useChrome();

  useEffect(() => {
    let isMounted = true;

    const checkOrgAdmin = async () => {
      try {
        const user = await auth.getUser();
        if (isMounted) {
          // Check user.identity.user.is_org_admin from the identity object
          setIsOrgAdmin(Boolean(user?.identity?.user?.is_org_admin));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsOrgAdmin(false);
          setIsLoading(false);
        }
      }
    };

    checkOrgAdmin();

    return () => {
      isMounted = false;
    };
  }, [auth]);

  return {
    isOrgAdmin,
    isLoading,
  };
};
