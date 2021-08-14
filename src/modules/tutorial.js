/* eslint-disable max-len */

// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@opendreamnet.com>, 2020.

// import { isNil } from 'lodash'
// import introJs from 'intro.js'

export const tutorial = {
  upload() {

    /*
    const seen = localStorage.getItem('tutorial.upload')

    if (!isNil(seen)) {
      return
    }

    const intro = introJs()

    intro.setOptions({
      showBullets: false,
      overlayOpacity: 0.7,
      steps: [
        {
          intro: 'Welcome to DreamTime! Let me give you some information about the interface.',
        },

        {
          intro: 'The first thing you should know is that you can drag and drop files, folders and web addresses into the application to nudify them.',
        },

        {
          element: '#uploader-methods',
          intro: 'If you do not like drag and drop here you can find the classic options to upload your photos.',
        },

        {
          element: '#uploader-settings',
          intro: 'What happens when uploading a photo is controlled by this option, initially it is set that the photos are placed in the pending queue.',
        },

        {
          element: '#queuebar',
          intro: 'This is the Queuebar, the place where you will find all the photos you upload, you can have up to 1,000 photos here and have DreamTime automatically nudify them.',
        },

        {
          element: '#queuebar',
          intro: 'As soon as you upload a photo you will see it here and you can put the mouse over it to see some options.',
        },

        {
          element: '#settings',
          intro: 'Do not forget to visit the settings, you can find several options to facilitate or improve your experience.',
        },

        {
          element: '#guide',
          intro: 'This is all for now, you can get more information by clicking on this link. Now is DreamTime!',
        },
      ],
    })

    intro.start()

    localStorage.setItem('tutorial.upload', 'true')
    */
  },

  photo() {

    /*
    const seen = localStorage.getItem('tutorial.photo')

    if (!isNil(seen)) {
      return
    }

    const intro = introJs()

    intro.setOptions({
      showBullets: false,
      overlayOpacity: 0.7,
      steps: [
        {
          intro: 'Welcome to the photo panel, from here you will have total control over the photo you want to nudify.',
        },

        {
          element: '#nudify-navigation',
          intro: 'Here you can find the main options of the photo, click on Preferences to modify the settings or click on Results to see the progress of the nudification.',
        },

        {
          element: '#nudify-tools',
          intro: 'Here you can find additional tools such as an editor to make adjustments before nudification or the cropper.',
        },

        {
          element: '#nudify-nudify',
          intro: 'All ready? Click on the nudify button to place your photo in the queue and start the nudification.',
        },

        {
          element: '#nudify-folder',
          intro: 'Click on this button to open the folder where all the photos you have nudified are saved.',
        },

        {
          element: '#nudify-forget',
          intro: 'You won\'t work with a photo anymore? Forget it, this will delete it from the application and free memory. Nudified photos will not be deleted.',
        },
      ],
    })

    intro.start()

    localStorage.setItem('tutorial.photo', 'true')
    */
  },

  badtime() {

    /*
    const seen = localStorage.getItem('tutorial.badtime')

    if (!isNil(seen)) {
      return
    }

    const intro = introJs()

    intro.setOptions({
      showBullets: false,
      overlayOpacity: 0.7,
      steps: [
        {
          intro: 'You have unlocked the BadTime mini-game! Use the arrows on your keyboard to play while your photos are nudified in the background. Can you survive until the end? 🎮💀',
        },
      ],
    })

    intro.start()

    localStorage.setItem('tutorial.badtime', 'true')
    */
  },

  preferences() {

    /*
    const seen = localStorage.getItem('tutorial.preferences')

    if (!isNil(seen)) {
      return
    }

    const intro = introJs()

    intro.setOptions({
      showBullets: false,
      overlayOpacity: 0.7,
      steps: [
        {
          intro: 'Photo preferences are an important part of DreamTime, they allow you to customize the results and can improve quality.',
        },

        {
          element: '#preferences-runs',
          intro: 'In this section you can find the options to execute several nudifications in the same photo. The best way to take advantage of them is to increase the number of runs and activate the Randomize or Progressive option so that each run has different preferences.',
        },

        {
          element: '#preferences-body',
          intro: 'In this section you can customize the size of the body parts, this depends entirely on your tastes!',
        },

        {
          element: '#preferences-advanced-scale',
          intro: 'Pay close attention to this option, indicate how your photo will be scaled and each option can produce different results.',
        },

        {
          intro: 'Our recommendation is that you take some time to experiment with these options in each photo. The same options do not always work for all photos.',
        },
      ],
    })

    intro.start()

    localStorage.setItem('tutorial.preferences', 'true')
    */
  },

  editor() {

    /*
    const seen = localStorage.getItem('tutorial.editor')

    if (!isNil(seen)) {
      return
    }

    const intro = introJs()

    intro.setOptions({
      showBullets: false,
      overlayOpacity: 0.7,
      steps: [
        {
          intro: 'Welcome to the photo editor, here you can make some improvements and corrections to the photo before nudifying it.',
        },

        {
          intro: 'Note that the editor does not have a crop tool, this is in a different section that will be visible depending on the "Scale method" option in Preferences.',
        },
      ],
    })

    intro.start()

    localStorage.setItem('tutorial.editor', 'true')
    */
  },

  cropper() {

    /*
    const seen = localStorage.getItem('tutorial.cropper')

    if (!isNil(seen)) {
      return
    }

    const intro = introJs()

    intro.setOptions({
      steps: [
        {
          intro: 'Welcome to the photo cropper, this tool is important as it allows you to control the area that will be nudified.',
        },

        {
          intro: 'On the right side you can find information on how to use the cropper and its function.',
        },

        {
          element: '#cropper-reload',
          intro: 'This button will allow you to reload the photo to get the latest changes from the editor, restart the cropper or troubleshoot when the cropper behaves strangely.',
        },

        {
          intro: 'As in the preferences, we recommend experimenting with the cropper, some users have reported having better results just by moving the cropper by a few centimeters.',
        },
      ],
    })

    intro.start()

    localStorage.setItem('tutorial.cropper', 'true')
    */
  },
}
