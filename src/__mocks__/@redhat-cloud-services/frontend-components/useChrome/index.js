const useChrome = () => {
  const auth = {
    getUser: () =>
      Promise.resolve({
        identity: {
          user: {
            is_org_admin: false,
          },
        },
      }),
  };

  return {
    auth,
  };
};

module.exports.useChrome = useChrome;
