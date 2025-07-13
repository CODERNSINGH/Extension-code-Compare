// /* global chrome */

// // const API_BASE_URL = 'https://api.sabapplier.com/api';
// const API_BASE_URL = 'http://127.0.0.1:8000/api';


// export const EmailLogin = async (email, onStatusUpdate) => {
//     const extractFormStructure = () => {
//         const inputs = document.querySelectorAll("input, textarea, select");
//         const formStructure = [];
//         inputs.forEach(input => {
//             if (!input.id && !input.name) return;
//             formStructure.push({
//                 selector: input.id ? `#${input.id}` : `[name=\"${input.name}\"]`,
//                 label: input.placeholder || input.labels?.[0]?.innerText || input.name || "",
//                 type: input.type || input.tagName.toLowerCase()
//             });
//         });
//         return formStructure;
//     };

//     const getPageHTML = () => {
//         return document.documentElement.outerHTML;
//     };

//     const checkCurrentFormState = () => {
//         // Check current state of all form fields
//         const inputs = document.querySelectorAll("input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])");
//         const currentState = [];
        
//         inputs.forEach(input => {
//             if (!input.id && !input.name) return;
            
//             const selector = input.id ? `#${input.id}` : `[name="${input.name}"]`;
//             const type = input.type || input.tagName.toLowerCase();
            
//             let currentValue = '';
//             if (type === 'checkbox' || type === 'radio') {
//                 currentValue = input.checked ? 'true' : 'false';
//             } else {
//                 currentValue = input.value || '';
//             }
            
//             currentState.push({
//                 selector: selector,
//                 currentValue: currentValue,
//                 isEmpty: currentValue === '' || currentValue === 'false',
//                 type: type
//             });
//         });
        
//         console.log('Current form state:', currentState);
//         return currentState;
//     };

//     try {
//         if (!email) {
//             onStatusUpdate("⚠️ Please log in to your account to continue.", "error");
//             throw new Error("Email is missing.");
//         }

//         const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//         const result = await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             function: extractFormStructure,
//         });

//         const formStructure = result[0].result;
//         onStatusUpdate("⏳ Sending form structure to backend...", "info");

//         const response = await fetch(`${API_BASE_URL}/users/extension/auto-fill/`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 html_data: formStructure,
//                 user_email: email,
//             }),
//         });

//         if (response.status !== 200) {
//             onStatusUpdate("❌ Failed to fetch autofill data", "error");
//             const errorData = await response.json().catch(() => ({ message: "Server returned an unreadable error" }));
//             throw new Error(errorData.message || "Failed to fetch autofill data");
//         }

//         const fillData = await response.json();
//         const autofill = JSON.parse(fillData.autofill_data);

//         // Autofill logic with robust selector matching and unfilled reporting
//         const fillResult = await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             func: (autofillData, formStructure) => {
//                 const filled = [];
//                 const notFilled = [];
//                 // Build a map for quick lookup
//                 const autofillMap = new Map();
//                 autofillData.forEach(data => {
//                     const selector = Object.keys(data).find(k => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size");
//                     if (selector) {
//                         autofillMap.set(selector, data);
//                     }
//                 });
//                 formStructure.forEach(field => {
//                     let autofillItem = autofillMap.get(field.selector);
//                     let matchType = 'exact';
//                     let triedSelectors = [field.selector];
//                     // Try by name
//                     if (!autofillItem && field.selector.startsWith('[name="')) {
//                         const name = field.selector.replace('[name="', '').replace('"]', '');
//                         for (let [sel, data] of autofillMap.entries()) {
//                             if (sel.includes(name)) {
//                                 autofillItem = data;
//                                 matchType = 'name';
//                                 triedSelectors.push(sel);
//                                 break;
//                             }
//                         }
//                     }
//                     // Try by id
//                     if (!autofillItem && field.selector.startsWith('#')) {
//                         const id = field.selector.replace('#', '');
//                         for (let [sel, data] of autofillMap.entries()) {
//                             if (sel.includes(id)) {
//                                 autofillItem = data;
//                                 matchType = 'id';
//                                 triedSelectors.push(sel);
//                                 break;
//                             }
//                         }
//                     }
//                     // Try input[name=...] and select[name=...]
//                     if (!autofillItem && field.selector.startsWith('[name="')) {
//                         const name = field.selector.replace('[name="', '').replace('"]', '');
//                         const altSelectors = [
//                             `input[name="${name}"]`,
//                             `select[name="${name}"]`,
//                             `textarea[name="${name}"]`
//                         ];
//                         for (let alt of altSelectors) {
//                             if (autofillMap.has(alt)) {
//                                 autofillItem = autofillMap.get(alt);
//                                 matchType = 'alt';
//                                 triedSelectors.push(alt);
//                                 break;
//                             }
//                         }
//                     }
//                     if (!autofillItem) {
//                         notFilled.push({
//                             selector: field.selector,
//                             value: 'No data available',
//                             type: field.type,
//                             reason: `No matching data found. Tried: ${triedSelectors.join(', ')}`
//                         });
//                         return;
//                     }
//                     const value = Object.keys(autofillItem).find(k => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size") ? autofillItem[field.selector] || autofillItem[Object.keys(autofillItem).find(k => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size")] : undefined;
//                     const type = autofillItem.type || field.type;
//                     // Try multiple selector formats for DOM lookup
//                     let input = document.querySelector(field.selector);
//                     if (!input && field.selector.startsWith('[name="')) {
//                         const name = field.selector.replace('[name="', '').replace('"]', '');
//                         input = document.querySelector(`input[name="${name}"]`) || document.querySelector(`select[name="${name}"]`) || document.querySelector(`textarea[name="${name}"]`);
//                     }
//                     if (!input && field.selector.startsWith('#')) {
//                         const id = field.selector.replace('#', '');
//                         input = document.getElementById(id);
//                     }
//                     if (!input) {
//                         notFilled.push({
//                             selector: field.selector,
//                             value: value,
//                             type: type,
//                             reason: `Element not found on page. Tried: ${triedSelectors.join(', ')}`
//                         });
//                         return;
//                     }
//                     let fillSuccess = false;
//                     try {
//                         if (["text", "email", "tel", "url", "password", "number", "date", "time", "datetime-local", "month", "week", "search"].includes(type) || type === "input") {
//                             input.value = value;
//                             input.dispatchEvent(new Event("input", { bubbles: true }));
//                             fillSuccess = input.value === value;
//                         } else if (type === "textarea") {
//                             input.value = value;
//                             input.dispatchEvent(new Event("input", { bubbles: true }));
//                             fillSuccess = input.value === value;
//                         } else if (type === "select") {
//                             input.value = value;
//                             input.dispatchEvent(new Event("change", { bubbles: true }));
//                             fillSuccess = input.value === value;
//                         } else if (type === "checkbox" || type === "radio") {
//                             const checkedValue = value === "true" || value === true || value === "checked";
//                             input.checked = checkedValue;
//                             input.dispatchEvent(new Event("change", { bubbles: true }));
//                             fillSuccess = input.checked === checkedValue;
//                         }
//                         if (fillSuccess) {
//                             filled.push({
//                                 selector: field.selector,
//                                 value: value,
//                                 type: type,
//                                 label: field.label
//                             });
//                         } else if (value !== "NA" && value !== "No data available") {
//                             notFilled.push({
//                                 selector: field.selector,
//                                 value: value,
//                                 type: type,
//                                 reason: `Field could not be filled (value not accepted, match: ${matchType})`
//                             });
//                         }
//                         // Log each field
//                         console.log(`Tried selector(s): ${triedSelectors.join(', ')} | Type: ${type} | Value: ${value} | Fill success: ${fillSuccess}`);
//                     } catch (err) {
//                         notFilled.push({
//                             selector: field.selector,
//                             value: value,
//                             type: type,
//                             reason: `Error filling field: ${err.message}`
//                         });
//                         console.error(`Error filling ${field.selector}:`, err);
//                     }
//                 });
//                 return { filled, notFilled };
//             },
//             args: [autofill, formStructure],
//         });

//         const fillResults = fillResult?.[0]?.result || { filled: [], notFilled: [] };
//         if (fillResults.notFilled && fillResults.notFilled.length > 0) {
//             onStatusUpdate(`${fillResults.notFilled.length} fields could not be filled automatically`, "warning");
//         } else {
//             onStatusUpdate("✅ Form filled successfully!", "success");
//         }
//         return { ...fillData, fillResults };
//     } catch (err) {
//         onStatusUpdate(`❌ Error: ${err.message}`, "error");
//         throw err;
//     }
// };

// export default EmailLogin;


/* global chrome */
const API_BASE_URL = 'http://127.0.0.1:8000/api';
// const API_BASE_URL = 'https://api.sabapplier.com/api';


export const EmailLogin = async (email, onStatusUpdate) => {
    const getPageHTML = () => {
        return document.documentElement.outerHTML;
    };

    try {
        if (!email) {
            onStatusUpdate("⚠️ Please log in to your account to continue.", "error");
            throw new Error("Email is missing. Please log in first.");
        }

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getPageHTML,
        });


        onStatusUpdate("✅ Collected form data from the current page.", "success");

        const htmlData = result[0].result;

        onStatusUpdate("⏳ Sending data to server for analysis...", "success");

        const response = await fetch(`${API_BASE_URL}/users/extension/auto-fill/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                html_data: htmlData,
                user_email: email,
            }),
        });


        onStatusUpdate("✅ Response received from the server Filling Form.", "success");

        if (response.status !== 200) {
            onStatusUpdate("❌ Unable to find user data. Please check your email or try again later.", "failed");
            setTimeout(() => onStatusUpdate("", "clear"), 5000);
            throw new Error("Server did not return a valid response. User may not exist.");
        }

        const fillData = await response.json();
        // const fillData = {"autofill_data": "[{\"input[name='txtName']\": \"testrandom\", \"type\": \"input\"}, {\"input[name='txtDOB']\": \"2025-04-08\", \"type\": \"input\"}, {\"input[name='rbtnGender'][value='F']\": \"checked\", \"type\": \"radio\"}, {\"select[name='ddlDistrict']\": \"select\", \"value\": \"None\"}, {\"select[name='ddlMandal']\": \"select\", \"value\": \"None\"}, {\"input[name='txtVillage']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"select[name='ddlCommunity']\": \"select\", \"value\": \"select\"}, {\"input[name='txtFatherName']\": \"test random father\", \"type\": \"input\"}, {\"input[name='txtMotherName']\": \"test random mother\", \"type\": \"input\"}, {\"select[name='ddlMotherTongue']\": \"select\", \"value\": \"select\"}, {\"input[name='txtMarks1']\": \"\", \"type\": \"input\"}, {\"input[name='txtMarks2']\": \"\", \"type\": \"input\"}, {\"input[name='txtEmailId']\": \"demoemail@gmail.com\", \"type\": \"input\"}, {\"input[name='txtMobileNo']\": \"9472828828\", \"type\": \"input\"}, {\"input[name='rbtnDisabled'][value='Y']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnExServicePerson'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnEmployee'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnNCC'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnEmployeed'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"select[name='ddlEmploymentNature']\": \"select\", \"value\": \"select\"}, {\"input[name='rbtnAreYouExEmployeeGovt'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='txtFlatNo']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtArea']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtDistrict']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtState']\": \"no state\", \"type\": \"input\"}, {\"input[name='txtPincode']\": \"pincode\", \"type\": \"input\"}, {\"input[name='txtFlatNo1']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtArea1']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtDistrict1']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtState1']\": \"no state\", \"type\": \"input\"}, {\"input[name='txtPincode1']\": \"pincode\", \"type\": \"input\"}, {\"checkbox[name='chkAddress']\": \"checked\", \"type\": \"checkbox\"}, {\"select[name='ddlStudy']\": \"select\", \"value\": \"O\"}, {\"select[name='ddlFourthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddl4thYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtFourthSchoolName']\": \"4th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlFifthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddl5thYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtFifthSchoolName']\": \"5th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlSixthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlsixthYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtSixthSchoolName']\": \"6th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlSeventhDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlSeventhYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtSeventhSchoolName']\": \"7th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlEigthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlEighthYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtEigthSchoolName']\": \"8th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlNinthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlNinethYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtNinthSchoolName']\": \"9th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlTenthDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txtBoard']\": \"X class Board\", \"type\": \"input\"}, {\"input[name='txtTenthSchoolName']\": \"X class School Name/Private Study\", \"type\": \"input\"}, {\"input[name='txtHallTicketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"select[name='ddlMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtTenthMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddl12thDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txt12thBoard']\": \"12th class Board\", \"type\": \"input\"}, {\"select[name='ddl12thGroup']\": \"select\", \"value\": \"select\"}, {\"input[name='txt12thHallTicketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txt12thCollegeName']\": \"12th class College Name\", \"type\": \"input\"}, {\"input[name='txt12thMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddl12thMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddl12thYear']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlDiplomaDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txtDiplomaBoard']\": \"Diploma Board\", \"type\": \"input\"}, {\"select[name='ddlDiplomaBranch']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlDiplomaMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlDiplomaYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtDiplomaHallTicketNo']\": \"Diploma Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txtDiplomaCollegeName']\": \"Diploma College Name\", \"type\": \"input\"}, {\"input[name='txtDiplomaMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddlGraduationDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlUniversity']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlGraduationGroup']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlGraduationMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlGraduationYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtGraduationHallTicketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txtGraduationCollegeName']\": \"College Name\", \"type\": \"input\"}, {\"input[name='txtGraduationMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddlPGDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGUniversity']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGGroup']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtPGHallticketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txtPGCollegeName']\": \"College Name\", \"type\": \"input\"}, {\"input[name='txtPGSpecialisation']\": \"Post Graduation Specialisation\", \"type\": \"input\"}, {\"input[name='txtPGMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddlMPhilDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txtMphilCollegeName']\": \"M.Phil College Name\", \"type\": \"input\"}, {\"select[name='ddlMPhilUniversity']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlMPhilMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlMPhilYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtMPhilSpecialisation']\": \"M.Phil Specialisation\", \"type\": \"input\"}, {\"select[name='ddlPHDUniversity']\": \"select\", \"value\": \"select\"}, {\"input[name='txtPHDSubject']\": \"Ph.D Subject\", \"type\": \"input\"}, {\"input[name='txtPHDTopic']\": \"Ph.D Topic\", \"type\": \"input\"}, {\"select[name='ddlPHDMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPHDYear']\": \"select\", \"value\": \"select\"}, {\"checkbox[name='chkAnyJob']\": \"checked\", \"type\": \"checkbox\"}, {\"checkbox[name='chkAgree']\": \"checked\", \"type\": \"checkbox\"}, {\"file[name='flUploadPhoto_ctl02']\": \"https://www.dropbox.com/scl/fi/wpnr76bru4fqd747ek04g/demoemail_passport_size_photo.jpg?rlkey=sf6ix69w1tbnjnxov9e9wqaxl&dl=0\", \"type\": \"file\"}, {\"file[name='flUploadSignature_ctl02']\": \"NA\", \"type\": \"file\"}]"};

        let autofillData = JSON.parse(fillData["autofill_data"]);
        console.log("Autofill Data:", autofillData);

        const fillResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async (autofillData) => {
                // cloudinary function for documents compression or expansion, and resizing.
                const uploadFileToCloudinary = async (dropboxUrl, filename, file_type, targetSize, pixels) => {
                    const cloudinaryUrl = "https://api.cloudinary.com/v1_1/detvvagxg/auto/upload";
                    const uploadPreset = "unsigned_preset_for_extension"; // Replace with your actual preset

                    const response = await fetch(dropboxUrl);
                    const blob = await response.blob();

                    const formData = new FormData();
                    formData.append("file", blob);
                    formData.append("upload_preset", uploadPreset);

                    const cloudRes = await fetch(cloudinaryUrl, {
                        method: "POST",
                        body: formData,
                    });

                    if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

                    const data = await cloudRes.json();

                    // Build transformed URL
                    try {
                        const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
                        file_type = file_type.split(',')[0].trim().toLowerCase().replace('.', '');
                        if (!allowedTypes.includes(file_type)) {
                            file_type = 'jpg'; // default will be jpg
                        }
                    } catch (err) {
                        console.log('error with file_type: ', err);
                        file_type = 'jpg';
                    }
                    let pixels_w = 600; let pixels_h = 800;
                    try {
                        [pixels_w, pixels_h] = pixels.toLowerCase().replace(/[^0-9x]/g, '').split('x').map(Number);
                    } catch (err) {
                        console.log('error occured with pixels: ', err);
                        pixels_w = 600; pixels_h = 800;
                    }
                    console.log('filename, file_type, size, pixels:', filename, file_type, pixels_w, pixels_h);
                    
                    const publicId = data.public_id;
                    for (let quality = 100; quality >= 20; quality -= 5) {
                        const transformedUrl = `https://res.cloudinary.com/detvvagxg/image/upload/f_${file_type},w_${pixels_w},h_${pixels_h},q_${quality},c_fill,g_auto/${publicId}`;
                        
                        const uploadedBlob = await fetch(transformedUrl).then(res => res.blob());
                        const file_name = `${ filename || data.original_filename }.${file_type}`;
                        const sizeKB = uploadedBlob.size / 1024;

                        console.log(`Quality ${quality}: ${sizeKB.toFixed(2)} KB`);

                        if (sizeKB <= targetSize + 5 || sizeKB >= targetSize - 5) {
                            console.log('filename: ', file_name, uploadedBlob.size/ 1024);
                            return new File([uploadedBlob], file_name, { type: uploadedBlob.type });
                        }
                    }
                };
                // ------------------------------- x ---------------------------------

                const allInputs = Array.from(
                    document.querySelectorAll("input, textarea, select, checkbox, radio, label, file")
                );
                let autofillIndex = 0;
                let input;
                const filled = [];
                const notFilled = [];

                while (autofillIndex < autofillData.length) {
                    const data = autofillData[autofillIndex];
                    const selector = Object.keys(data).find((k) => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size");
                    const value = data[selector];
                    const inputType = data["type"] || selector.split('[')[0];

                    try {
                        if (["input", "textarea", "select"].includes(inputType)) {
                            input = document.querySelector(selector);
                            if (!input) { 
                                notFilled.push({
                                    selector: selector,
                                    value: value,
                                    type: inputType,
                                    reason: 'Element not found on page'
                                });
                                autofillIndex++; 
                                continue; 
                            }
                            input.value = String(value);
                            input.dispatchEvent(new Event("input", { bubbles: true }));
                            filled.push({
                                selector: selector,
                                value: value,
                                type: inputType
                            });
                            console.log("input filled: ", input, value);
                        } else if (inputType === "checkbox") {
                            input = document.querySelector(selector);
                            if (!input) { 
                                notFilled.push({
                                    selector: selector,
                                    value: value,
                                    type: inputType,
                                    reason: 'Element not found on page'
                                });
                                autofillIndex++; 
                                continue; 
                            }
                            if (["false", false, 'no', 'NO', 'No', ''].includes(value)) {
                                input.checked = false;
                            } else {
                                input.checked = true;
                            }
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            filled.push({
                                selector: selector,
                                value: value,
                                type: inputType
                            });
                            console.log("checkbox filled: ", input, value);
                        } else if (inputType === "radio") {
                            input = document.querySelector(selector);
                            if (!input) { 
                                notFilled.push({
                                    selector: selector,
                                    value: value,
                                    type: inputType,
                                    reason: 'Element not found on page'
                                });
                                autofillIndex++; 
                                continue; 
                            }
                            input.checked = value;
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            filled.push({
                                selector: selector,
                                value: value,
                                type: inputType
                            });
                            console.log("radio filled: ", input, value);
                        } else if (inputType === "label") {
                            input = document.querySelector(selector);
                            if (!input) { 
                                notFilled.push({
                                    selector: selector,
                                    value: value,
                                    type: inputType,
                                    reason: 'Element not found on page'
                                });
                                autofillIndex++; 
                                continue; 
                            }
                            input.click();
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            filled.push({
                                selector: selector,
                                value: value,
                                type: inputType
                            });
                            console.log("label filled: ", input, value);
                        } else if (inputType === "file") {
                            try {
                                const dropbox_url = value
                                    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
                                    .replace("?dl=0", "");

                                // Get quality for compression
                                let quality = 100;
                                let actualSize = 'error';
                                let targetSize = 'error';
                                try {
                                    const response = await fetch(dropbox_url, { method: "HEAD" });
                                    const sizeBytes = parseInt(response.headers.get("Content-Length"), 10);
                                    actualSize =  sizeBytes / 1024; // convert to KB
                                    targetSize = parseFloat(data["size"]); // expected in KB
                                    quality = Math.min(100, Math.floor((targetSize / actualSize) * 100));
                                } catch (err) {
                                    console.log('error while calculating compression: ', err);
                                    quality = 100;
                                }
                                
                                console.log("while filling image: ", dropbox_url, data['file_name'], data["file_type"] || data['file_name'].split('.')[1], actualSize, targetSize, quality, data["pixels"])
                                const filename = data['file_name']?.split('.')[0] || value.split("/").pop().split("?")[0];
                                const file = await uploadFileToCloudinary(dropbox_url, filename, data["file_type"], targetSize, data["pixels"]);
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);

                                input = document.querySelector(selector);
                                if (!input) { 
                                    notFilled.push({
                                        selector: selector,
                                        value: value,
                                        type: inputType,
                                        reason: 'Element not found on page'
                                    });
                                    autofillIndex++; 
                                    continue; 
                                }
                                input.files = dataTransfer.files;
                                input.dispatchEvent(new Event("change", { bubbles: true }));
                                filled.push({
                                    selector: selector,
                                    value: value,
                                    type: inputType
                                });
                                console.log("file filled: ", input, filename);
                            } catch (err) {
                                console.error(`❌ File upload failed for ${selector}:`, err);
                                notFilled.push({
                                    selector: selector,
                                    value: value,
                                    type: inputType,
                                    reason: `File upload failed: ${err.message}`
                                });
                            }
                        } else {
                            console.warn(`⚠️ Unknown input type "${inputType}" for ${selector}`);
                            notFilled.push({
                                selector: selector,
                                value: value,
                                type: inputType,
                                reason: `Unknown input type: ${inputType}`
                            });
                        }
                    } catch (err) {
                        console.error(`❌ Error filling input ${selector}:`, err);
                        notFilled.push({
                            selector: selector,
                            value: value,
                            type: inputType,
                            reason: `Error filling field: ${err.message}`
                        });
                    }

                    autofillIndex++;
                }
                
                return { filled, notFilled };
            },
            args: [autofillData],
        });

        onStatusUpdate("✅ Step 4: Form filled successfully!", "success");
        setTimeout(() => onStatusUpdate("", "clear"), 5000);
        
        // Get the fill results from the executed script
        const fillResults = fillResult?.[0]?.result || { filled: [], notFilled: [] };
        
        return { 
            ...fillData, 
            fillResults 
        };
    } catch (error) {
        onStatusUpdate(`❌ Something went wrong: ${error.message}`, "error");
    }
};

export default EmailLogin;