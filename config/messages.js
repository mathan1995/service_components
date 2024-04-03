module.exports = {
  errors: {
    courseLevel: {
      disabledErrorMessage:
        'Course level intake control is currently disabled in the Recruiter portal',
    },
    intakeLevel: {
      disabledErrorMessage:
        'Intake level intake control is currently disabled in the Recruiter portal',
    },
  },

  validations: {
    closingDate: {
      required: 'Closing date is required.',
      date: 'Next closing date date must be a valid date.',
      date_after_or_on:
        'Intake closures can only be scheduled in the future. Please enter a closing date after today.',
    },
    nextOpenDate: {
      required: 'Next open date is required.',
      date: 'Next open date must be a valid date.',
      date_after: 'Next open date must be after closing date.',
    },
  },
};
