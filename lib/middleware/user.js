const { Router } = require('express');

const router = Router();

router.use(async (req, res, next) => {
  try {
    const { Profile } = await req.models;

    // Function to fetch the user's profile
    const getProfile = async () => {
      const profiles = await Profile.query()
        .where({ userId: req.user.id })
        .withGraphFetched('establishments');
      return profiles[0]; // Return the first profile or undefined
    };

    // Function to create a new profile for the user
    const createProfile = async () => {
      const params = {
        model: 'profile',
        data: {
          userId: req.user.id,
          firstName: req.user._auth.given_name,
          lastName: req.user._auth.family_name,
          email: req.user._auth.email,
          emailConfirmed: req.user._auth.email_verified
        }
      };
      const workflowProfileUpdate = await req.workflow.create(params);
      console.log('workflowProfileUpdate:--', workflowProfileUpdate);
      return workflowProfileUpdate;
    };

    // Function to confirm the user's email
    const confirmEmail = async () => {
      const params = {
        model: 'profile',
        action: 'confirm-email',
        id: req.user.profile.id,
        data: {}
      };
      const workflowEmailUpdate = await req.workflow.update(params);
      console.log('workflowEmailUpdate:--', workflowEmailUpdate);
      return workflowEmailUpdate;
    };

    // Override the user `can` method to set `permissionChecked`
    const can = req.user.can;
    req.user.can = (...args) => {
      Object.defineProperty(req, 'permissionChecked', { value: true });
      return can(...args);
    };

    // Fetch or create the profile
    let profile = await getProfile();
    if (!profile) {
      await createProfile();
      profile = await getProfile();
    }

    // Attach the profile to the user object
    req.user.profile = profile;

    // Confirm email if necessary
    if (!req.user.profile.emailConfirmed && req.user._auth.email_verified) {
      await confirmEmail();
      req.user.profile.emailConfirmed = true;
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
