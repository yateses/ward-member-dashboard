// LCR Data Extractor Bookmarklet
// This script extracts member data from LCR reports and copies it to clipboard

(function() {
    'use strict';
    
    // Check if we're on the LCR website
    if (!window.location.hostname.includes('lcr.churchofjesuschrist.org')) {
        alert('❌ This bookmarklet only works on the LCR website (lcr.churchofjesuschrist.org)');
        return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3498db;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    loadingDiv.textContent = '🔄 Extracting LCR data...';
    document.body.appendChild(loadingDiv);
    
    // Function to remove loading indicator
    function removeLoading() {
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    }
    
    // Function to show success/error message
    function showMessage(message, isError = false) {
        removeLoading();
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? '#e74c3c' : '#27ae60'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    // Main extraction function
    async function extractLCRData() {
        try {
            // Try to find the report data in the current page
            let reportData = null;
            
            // Method 1: Look for report data in global variables
            if (window.reportData) {
                reportData = window.reportData;
            }
            
            // Method 2: Look for report data in script tags
            if (!reportData) {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    if (script.textContent.includes('reportData') || script.textContent.includes('members')) {
                        try {
                            // Try to extract JSON from script content
                            const matches = script.textContent.match(/reportData\s*=\s*({.*?});/s);
                            if (matches) {
                                reportData = JSON.parse(matches[1]);
                                break;
                            }
                        } catch (e) {
                            // Continue searching
                        }
                    }
                }
            }
            
            // Method 3: Try to fetch from API (if we can determine the report ID)
            if (!reportData) {
                // Look for report ID in URL or page content
                const urlMatch = window.location.href.match(/report\/([a-f0-9-]+)/);
                const reportId = urlMatch ? urlMatch[1] : '270dd333-769f-43a0-b73e-d27cc6d5d730'; // Default fallback
                
                const response = await fetch(`https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/${reportId}?lang=eng`);
                if (response.ok) {
                    reportData = await response.json();
                }
            }
            
            if (!reportData) {
                throw new Error('Could not find report data on this page. Make sure you are viewing a member report.');
            }
            
            // Extract headers and data
            const rows = [];
            const header = [];
            
            // Extract headers
            if (reportData.columns) {
                for (const column of reportData.columns) {
                    header.push(column.key);
                }
            } else if (reportData.headers) {
                header.push(...reportData.headers);
            } else {
                // Fallback: use common LCR headers
                header.push('PREFERRED_NAME', 'HEAD_OF_HOUSE', 'ADDRESS_STREET_1', 'AGE', 'BAPTISM_DATE', 
                           'BIRTH_DATE', 'CALLINGS', 'BIRTH_DAY', 'BIRTH_MONTH', 'BIRTH_YEAR', 
                           'BIRTHPLACE', 'GENDER', 'INDIVIDUAL_PHONE', 'INDIVIDUAL_EMAIL', 
                           'MARRIAGE_DATE', 'PRIESTHOOD_OFFICE', 'TEMPLE_RECOMMEND_EXPIRATION_DATE');
            }
            rows.push(header);
            
            // Extract member data
            if (reportData.members && Array.isArray(reportData.members)) {
                for (const member of reportData.members) {
                    const row = [];
                    if (reportData.columns) {
                        for (const column of reportData.columns) {
                            row.push(member[column.key] || '');
                        }
                    } else {
                        // Fallback: try to extract common fields
                        row.push(
                            member.preferredName || member.PREFERRED_NAME || '',
                            member.headOfHouse || member.HEAD_OF_HOUSE || '',
                            member.addressStreet1 || member.ADDRESS_STREET_1 || '',
                            member.age || member.AGE || '',
                            member.baptismDate || member.BAPTISM_DATE || '',
                            member.birthDate || member.BIRTH_DATE || '',
                            member.callings || member.CALLINGS || '',
                            member.birthDay || member.BIRTH_DAY || '',
                            member.birthMonth || member.BIRTH_MONTH || '',
                            member.birthYear || member.BIRTH_YEAR || '',
                            member.birthplace || member.BIRTHPLACE || '',
                            member.gender || member.GENDER || '',
                            member.individualPhone || member.INDIVIDUAL_PHONE || '',
                            member.individualEmail || member.INDIVIDUAL_EMAIL || '',
                            member.marriageDate || member.MARRIAGE_DATE || '',
                            member.priesthoodOffice || member.PRIESTHOOD_OFFICE || '',
                            member.templeRecommendExpirationDate || member.TEMPLE_RECOMMEND_EXPIRATION_DATE || ''
                        );
                    }
                    rows.push(row);
                }
            }
            
            if (rows.length <= 1) {
                throw new Error('No member data found. Make sure you are viewing a member report with data.');
            }
            
            // Convert to tab-separated format
            const tabData = rows.map(row => row.join('\t')).join('\n');
            
            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(tabData);
                showMessage(`✅ Success! Copied ${rows.length - 1} members to clipboard.`);
                console.log('Extracted data:', tabData);
            } catch (clipboardError) {
                // Fallback: create a textarea and copy from it
                const textarea = document.createElement('textarea');
                textarea.value = tabData;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                showMessage(`✅ Success! Copied ${rows.length - 1} members to clipboard.`);
                console.log('Extracted data:', tabData);
            }
            
        } catch (error) {
            console.error('LCR Data Extractor Error:', error);
            showMessage(`❌ Error: ${error.message}`, true);
        }
    }
    
    // Run the extraction
    extractLCRData();
    
})(); 