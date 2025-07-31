// Popup helper script to detect LCR login success
(function() {
    'use strict';
    
    console.log('Popup helper script loaded');
    
    // Function to check if we're on the LCR main page (indicating successful login)
    function checkIfLoggedIn() {
        // Check if we're on the LCR main page
        if (window.location.hostname === 'lcr.churchofjesuschrist.org' && 
            (window.location.pathname === '/' || 
             window.location.pathname.includes('dashboard') ||
             window.location.pathname.includes('home'))) {
            
            console.log('Detected successful login to LCR');
            
            // Send message to parent window
            if (window.opener) {
                window.opener.postMessage({
                    type: 'LCR_LOGIN_SUCCESS',
                    timestamp: Date.now()
                }, '*');
                
                console.log('Sent login success message to parent window');
            }
            
            return true;
        }
        
        // Check if we're on the callback page
        if (window.location.hostname === 'lcr.churchofjesuschrist.org' && 
            window.location.pathname.includes('callback')) {
            
            console.log('Detected OAuth callback - login successful');
            
            // Send message to parent window
            if (window.opener) {
                window.opener.postMessage({
                    type: 'LCR_LOGIN_SUCCESS',
                    timestamp: Date.now()
                }, '*');
                
                console.log('Sent login success message to parent window');
            }
            
            return true;
        }
        
        return false;
    }
    
    // Check immediately
    if (checkIfLoggedIn()) {
        return;
    }
    
    // Set up periodic checking
    const checkInterval = setInterval(() => {
        if (checkIfLoggedIn()) {
            clearInterval(checkInterval);
        }
    }, 1000); // Check every second
    
    // Also listen for URL changes (for SPA navigation)
    let currentUrl = window.location.href;
    
    const urlCheckInterval = setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            if (checkIfLoggedIn()) {
                clearInterval(urlCheckInterval);
                clearInterval(checkInterval);
            }
        }
    }, 500);
    
    // Clean up after 5 minutes
    setTimeout(() => {
        clearInterval(checkInterval);
        clearInterval(urlCheckInterval);
    }, 300000);
    
})(); 