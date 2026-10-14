// Theme management for ALAM IOT SCADA.
// Light is the deliberate first-visit default. A user choice is persisted;
// the operating-system preference never silently changes the application.
(function () {
    'use strict';

    // Versioned once so an old pre-light-default dark preference cannot make
    // the first visit appear dark after this release.
    var STORAGE_KEY = 'scada_theme_v2';
    var sessionPreference = null;

    function readPreference() {
        try {
            var storage = window.localStorage || (typeof localStorage !== 'undefined' && localStorage);
            var value = storage && storage.getItem(STORAGE_KEY);
            return value === 'dark' || value === 'light' ? value : sessionPreference;
        } catch (_) {
            return sessionPreference;
        }
    }

    function applyTheme(isDark) {
        var mode = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', mode);
        if (document.body && document.body.classList) {
            document.body.classList.toggle('dark-theme', isDark);
        }
        return isDark;
    }

    window.theme = {
        initTheme: function () {
            var saved = readPreference();
            var isDark = saved === 'dark';
            applyTheme(isDark);
            return isDark;
        },

        apply: applyTheme,

        setTheme: function (isDark) {
            sessionPreference = isDark ? 'dark' : 'light';
            try {
                var storage = window.localStorage || (typeof localStorage !== 'undefined' && localStorage);
                if (storage) storage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
            } catch (_) { /* blocked storage must not prevent the visual change */ }
            return applyTheme(!!isDark);
        }
    };

    // Immediate execution in <head> prevents a theme flash. No saved choice means light.
    applyTheme(readPreference() === 'dark');
})();
