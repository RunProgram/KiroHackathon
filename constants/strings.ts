export const Strings = {
  // Button labels
  buttons: {
    tellMeWhatHappened: 'Tell me what happened',
    showMessageOrPhoto: 'Show a message or photo',
    callTrustedPerson: 'Call my trusted person',
    analyze: 'Analyze',
    cancel: 'Cancel',
    save: 'Save',
    startOver: 'Start over',
    hearThisAloud: 'Hear this aloud',
    takePhoto: 'Take a photo',
    chooseFromLibrary: 'Choose from library',
    edit: 'Edit',
    setUpTrustedContact: 'Set up trusted contact',
  },

  // Screen titles
  screenTitles: {
    home: 'TrustPause',
    voiceInput: 'Voice Input',
    photoInput: 'Photo Input',
    results: 'Results',
    trustedContact: 'Trusted Contact',
    demoScenarios: 'Demo Scenarios',
  },

  // Subtitles
  subtitles: {
    homeReassurance: "You're safe. Let's check together.",
  },

  // Error and prompt messages
  messages: {
    noSpeechDetected: "We didn't catch that — please try again",
    noTextInImage:
      'No text found in image. Try describing the situation using voice instead.',
    noTrustedContact: 'Please set up a trusted contact.',
    noTrustedContactPrompt:
      'No trusted contact saved yet. Set one up so you can call for help instantly.',
    invalidPhoneNumber: 'Invalid phone number format.',
    contactSaved: 'Contact saved successfully.',
    callFailed: 'Could not start the call. Please dial manually.',
    noContactForCall:
      'No trusted contact saved. Please set up a trusted contact first.',
  },

  // Section headings (Results screen)
  sectionHeadings: {
    whyLooksSuspicious: 'Why this looks suspicious',
    whatToDoNow: 'What to do now',
    whatNotToDo: 'What not to do',
    suggestions: 'Suggestions',
    questionsToAsk: 'Questions to ask',
    whatToSay: 'What to say',
  },

  // Caregiver recommendation
  caregiverRecommendation:
    'We strongly recommend contacting your trusted person about this.',
} as const;
