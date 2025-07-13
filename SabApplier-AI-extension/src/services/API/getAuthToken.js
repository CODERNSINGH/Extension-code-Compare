// /* global chrome */
// // const API_BASE_URL = 'http://127.0.0.1:8000/api';
// const API_BASE_URL = 'https://api.sabapplier.com/api';


// export const EmailLogin = async (email, onStatusUpdate) => {
//     const getPageHTML = () => {
//         return document.documentElement.outerHTML;
//     };

//     try {
//         if (!email) {
//             onStatusUpdate("⚠️ Please log in to your account to continue.", "error");
//             throw new Error("Email is missing. Please log in first.");
//         }

//         const [tab] = await chrome.tabs.query({
//             active: true,
//             currentWindow: true,
//         });

//         const result = await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             function: getPageHTML,
//         });


//         onStatusUpdate("✅ Collected form data from the current page.", "success");

//         const htmlData = result[0].result;

//         onStatusUpdate("⏳ Sending data to server for analysis...", "success");

//         const response = await fetch(`${API_BASE_URL}/users/extension/auto-fill/`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 html_data: htmlData,
//                 user_email: email,
//             }),
//         });


//         onStatusUpdate("✅ Response received from the server.", "success");

//         if (response.status !== 200) {
//             onStatusUpdate("❌ Unable to find user data. Please check your email or try again later.", "failed");
//             setTimeout(() => onStatusUpdate("", "clear"), 5000);
//             throw new Error("Server did not return a valid response. User may not exist.");
//         }

//         const fillData = await response.json();
//         // const fillData = {"autofill_data": "[{\"input[name='txtName']\": \"testrandom\", \"type\": \"input\"}, {\"input[name='txtDOB']\": \"2025-04-08\", \"type\": \"input\"}, {\"input[name='rbtnGender'][value='F']\": \"checked\", \"type\": \"radio\"}, {\"select[name='ddlDistrict']\": \"select\", \"value\": \"None\"}, {\"select[name='ddlMandal']\": \"select\", \"value\": \"None\"}, {\"input[name='txtVillage']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"select[name='ddlCommunity']\": \"select\", \"value\": \"select\"}, {\"input[name='txtFatherName']\": \"test random father\", \"type\": \"input\"}, {\"input[name='txtMotherName']\": \"test random mother\", \"type\": \"input\"}, {\"select[name='ddlMotherTongue']\": \"select\", \"value\": \"select\"}, {\"input[name='txtMarks1']\": \"\", \"type\": \"input\"}, {\"input[name='txtMarks2']\": \"\", \"type\": \"input\"}, {\"input[name='txtEmailId']\": \"demoemail@gmail.com\", \"type\": \"input\"}, {\"input[name='txtMobileNo']\": \"9472828828\", \"type\": \"input\"}, {\"input[name='rbtnDisabled'][value='Y']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnExServicePerson'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnEmployee'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnNCC'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='rbtnEmployeed'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"select[name='ddlEmploymentNature']\": \"select\", \"value\": \"select\"}, {\"input[name='rbtnAreYouExEmployeeGovt'][value='N']\": \"checked\", \"type\": \"radio\"}, {\"input[name='txtFlatNo']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtArea']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtDistrict']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtState']\": \"no state\", \"type\": \"input\"}, {\"input[name='txtPincode']\": \"pincode\", \"type\": \"input\"}, {\"input[name='txtFlatNo1']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtArea1']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtDistrict1']\": \"my correspondence address you don't need it\", \"type\": \"input\"}, {\"input[name='txtState1']\": \"no state\", \"type\": \"input\"}, {\"input[name='txtPincode1']\": \"pincode\", \"type\": \"input\"}, {\"checkbox[name='chkAddress']\": \"checked\", \"type\": \"checkbox\"}, {\"select[name='ddlStudy']\": \"select\", \"value\": \"O\"}, {\"select[name='ddlFourthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddl4thYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtFourthSchoolName']\": \"4th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlFifthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddl5thYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtFifthSchoolName']\": \"5th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlSixthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlsixthYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtSixthSchoolName']\": \"6th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlSeventhDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlSeventhYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtSeventhSchoolName']\": \"7th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlEigthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlEighthYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtEigthSchoolName']\": \"8th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlNinthDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlNinethYearOfPassing']\": \"select\", \"value\": \"select\"}, {\"input[name='txtNinthSchoolName']\": \"9th Class School Name\", \"type\": \"input\"}, {\"select[name='ddlTenthDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txtBoard']\": \"X class Board\", \"type\": \"input\"}, {\"input[name='txtTenthSchoolName']\": \"X class School Name/Private Study\", \"type\": \"input\"}, {\"input[name='txtHallTicketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"select[name='ddlMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtTenthMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddl12thDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txt12thBoard']\": \"12th class Board\", \"type\": \"input\"}, {\"select[name='ddl12thGroup']\": \"select\", \"value\": \"select\"}, {\"input[name='txt12thHallTicketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txt12thCollegeName']\": \"12th class College Name\", \"type\": \"input\"}, {\"input[name='txt12thMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddl12thMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddl12thYear']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlDiplomaDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txtDiplomaBoard']\": \"Diploma Board\", \"type\": \"input\"}, {\"select[name='ddlDiplomaBranch']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlDiplomaMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlDiplomaYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtDiplomaHallTicketNo']\": \"Diploma Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txtDiplomaCollegeName']\": \"Diploma College Name\", \"type\": \"input\"}, {\"input[name='txtDiplomaMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddlGraduationDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlUniversity']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlGraduationGroup']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlGraduationMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlGraduationYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtGraduationHallTicketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txtGraduationCollegeName']\": \"College Name\", \"type\": \"input\"}, {\"input[name='txtGraduationMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddlPGDistrict']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGUniversity']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGGroup']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPGYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtPGHallticketNo']\": \"Hall Ticket Number\", \"type\": \"input\"}, {\"input[name='txtPGCollegeName']\": \"College Name\", \"type\": \"input\"}, {\"input[name='txtPGSpecialisation']\": \"Post Graduation Specialisation\", \"type\": \"input\"}, {\"input[name='txtPGMarks']\": \"percentage\", \"type\": \"input\"}, {\"select[name='ddlMPhilDistrict']\": \"select\", \"value\": \"select\"}, {\"input[name='txtMphilCollegeName']\": \"M.Phil College Name\", \"type\": \"input\"}, {\"select[name='ddlMPhilUniversity']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlMPhilMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlMPhilYear']\": \"select\", \"value\": \"select\"}, {\"input[name='txtMPhilSpecialisation']\": \"M.Phil Specialisation\", \"type\": \"input\"}, {\"select[name='ddlPHDUniversity']\": \"select\", \"value\": \"select\"}, {\"input[name='txtPHDSubject']\": \"Ph.D Subject\", \"type\": \"input\"}, {\"input[name='txtPHDTopic']\": \"Ph.D Topic\", \"type\": \"input\"}, {\"select[name='ddlPHDMonth']\": \"select\", \"value\": \"select\"}, {\"select[name='ddlPHDYear']\": \"select\", \"value\": \"select\"}, {\"checkbox[name='chkAnyJob']\": \"checked\", \"type\": \"checkbox\"}, {\"checkbox[name='chkAgree']\": \"checked\", \"type\": \"checkbox\"}, {\"file[name='flUploadPhoto_ctl02']\": \"https://www.dropbox.com/scl/fi/wpnr76bru4fqd747ek04g/demoemail_passport_size_photo.jpg?rlkey=sf6ix69w1tbnjnxov9e9wqaxl&dl=0\", \"type\": \"file\"}, {\"file[name='flUploadSignature_ctl02']\": \"NA\", \"type\": \"file\"}]"};

//         let autofillData = JSON.parse(fillData["autofill_data"]);
//         console.log("Autofill Data:", autofillData);

//         await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             func: async (autofillData) => {
//                 // cloudinary function for documents compression or expansion, and resizing.
//                 const uploadFileToCloudinary = async (dropboxUrl, filename, file_type, targetSize, pixels) => {
//                     const cloudinaryUrl = "https://api.cloudinary.com/v1_1/detvvagxg/auto/upload";
//                     const uploadPreset = "unsigned_preset_for_extension"; // Replace with your actual preset

//                     const response = await fetch(dropboxUrl);
//                     const blob = await response.blob();

//                     const formData = new FormData();
//                     formData.append("file", blob);
//                     formData.append("upload_preset", uploadPreset);

//                     const cloudRes = await fetch(cloudinaryUrl, {
//                         method: "POST",
//                         body: formData,
//                     });

//                     if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

//                     const data = await cloudRes.json();

//                     // Build transformed URL
//                     try {
//                         const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
//                         file_type = file_type.split(',')[0].trim().toLowerCase().replace('.', '');
//                         if (!allowedTypes.includes(file_type)) {
//                             file_type = 'jpg'; // default will be jpg
//                         }
//                     } catch (err) {
//                         console.log('error with file_type: ', err);
//                         file_type = 'jpg';
//                     }
//                     let pixels_w = 600; let pixels_h = 800;
//                     try {
//                         [pixels_w, pixels_h] = pixels.toLowerCase().replace(/[^0-9x]/g, '').split('x').map(Number);
//                     } catch (err) {
//                         console.log('error occured with pixels: ', err);
//                         pixels_w = 600; pixels_h = 800;
//                     }
//                     console.log('filename, file_type, size, pixels:', filename, file_type, pixels_w, pixels_h);
                    
//                     const publicId = data.public_id;
//                     for (let quality = 100; quality >= 20; quality -= 5) {
//                         const transformedUrl = `https://res.cloudinary.com/detvvagxg/image/upload/f_${file_type},w_${pixels_w},h_${pixels_h},q_${quality},c_fill,g_auto/${publicId}`;
                        
//                         const uploadedBlob = await fetch(transformedUrl).then(res => res.blob());
//                         const file_name = `${ filename || data.original_filename }.${file_type}`;
//                         const sizeKB = uploadedBlob.size / 1024;

//                         console.log(`Quality ${quality}: ${sizeKB.toFixed(2)} KB`);

//                         if (sizeKB <= targetSize + 5 || sizeKB >= targetSize - 5) {
//                             console.log('filename: ', file_name, uploadedBlob.size/ 1024);
//                             return new File([uploadedBlob], file_name, { type: uploadedBlob.type });
//                         }
//                     }
//                     // console.log('transformedUrl: ', transformedUrl)
//                     // // Fetch transformed file
//                     // const uploadedBlob = await fetch(transformedUrl).then(res => res.blob());
//                     // const file_name = `${ filename || data.original_filename }.${file_type}`;
                    
//                     // console.log('filename: ', file_name, uploadedBlob.size/ 1024);
//                     // // Return transformed file object
//                     // return new File([uploadedBlob], file_name, { type: uploadedBlob.type });

//                 };
//                 // ------------------------------- x ---------------------------------

//                 const allInputs = Array.from(
//                     document.querySelectorAll("input, textarea, select, checkbox, radio, label, file")
//                 );
//                 let autofillIndex = 0;
//                 let input;

//                 while (autofillIndex < autofillData.length) {
//                     const data = autofillData[autofillIndex];
//                     const selector = Object.keys(data).find((k) => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size");
//                     const value = data[selector];
//                     const inputType = data["type"] || selector.split('[')[0];

//                     try {
//                         if (["input", "textarea", "select"].includes(inputType)) {
//                             input = document.querySelector(selector);
//                             if (!input) { autofillIndex++; continue; }
//                             input.value = String(value);
//                             input.dispatchEvent(new Event("input", { bubbles: true }));
//                             console.log("input filled: ", input, value);
//                         } else if (inputType === "checkbox") {
//                             input = document.querySelector(selector);
//                             if (!input) { autofillIndex++; continue; }
//                             if (["false", false, 'no', 'NO', 'No', ''].includes(value)) {
//                                 input.checked = false;
//                             } else {
//                                 input.checked = true;
//                             }
//                             input.dispatchEvent(new Event("change", { bubbles: true }));
//                             console.log("checkbox filled: ", input, value);
//                         } else if (inputType === "radio") {
//                             input = document.querySelector(selector);
//                             if (!input) { autofillIndex++; continue; }
//                             input.checked = value;
//                             input.dispatchEvent(new Event("change", { bubbles: true }));
//                             console.log("radio filled: ", input, value);
//                         } else if (inputType === "label") {
//                             input = document.querySelector(selector);
//                             if (!input) { autofillIndex++; continue; }
//                             input.click();
//                             input.dispatchEvent(new Event("change", { bubbles: true }));
//                             console.log("label filled: ", input, value);
//                         } else if (inputType === "file") {
//                             try {
//                                 const dropbox_url = value
//                                     .replace("www.dropbox.com", "dl.dropboxusercontent.com")
//                                     .replace("?dl=0", "");

//                                 // Get quality for compression
//                                 let quality = 100;
//                                 let actualSize = 'error';
//                                 let targetSize = 'error';
//                                 try {
//                                     const response = await fetch(dropbox_url, { method: "HEAD" });
//                                     const sizeBytes = parseInt(response.headers.get("Content-Length"), 10);
//                                     actualSize =  sizeBytes / 1024; // convert to KB
//                                     targetSize = parseFloat(data["size"]); // expected in KB
//                                     quality = Math.min(100, Math.floor((targetSize / actualSize) * 100));
//                                 } catch (err) {
//                                     console.log('error while calculating compression: ', err);
//                                     quality = 100;
//                                 }
                                
//                                 console.log("while filling image: ", dropbox_url, data['file_name'], data["file_type"] || data['file_name'].split('.')[1], actualSize, targetSize, quality, data["pixels"])
//                                 const filename = data['file_name']?.split('.')[0] || value.split("/").pop().split("?")[0];
//                                 const file = await uploadFileToCloudinary(dropbox_url, filename, data["file_type"], targetSize, data["pixels"]);
//                                 const dataTransfer = new DataTransfer();
//                                 dataTransfer.items.add(file);

//                                 input = document.querySelector(selector);
//                                 if (!input) { autofillIndex++; continue; }
//                                 input.files = dataTransfer.files;
//                                 input.dispatchEvent(new Event("change", { bubbles: true }));
//                                 console.log("file filled: ", input, filename);
//                             } catch (err) {
//                                 console.error(`❌ File upload failed for ${selector}:`, err);
//                             }
//                         } else {
//                             console.warn(`⚠️ Unknown input type "${inputType}" for ${selector}`);
//                         }
//                     } catch (err) {
//                         console.error(`❌ Error filling input ${selector}:`, err);
//                     }

//                     autofillIndex++;
//                 }
//             },
//             args: [autofillData],
//         });

//         onStatusUpdate("✅ Step 4: Form filled successfully!", "success");
//         setTimeout(() => onStatusUpdate("", "clear"), 5000);
//         return fillData;
//     } catch (error) {
//         onStatusUpdate(`❌ Something went wrong: ${error.message}`, "error");
//     }
// };

// export default EmailLogin;