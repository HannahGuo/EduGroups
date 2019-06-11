var config = {
    // apiKey: //REMOVED,
    // authDomain: //REMOVED,
    // databaseURL: //REMOVED,
    // projectId: //REMOVED
    // storageBucket: //REMOVED
    // messagingSenderId: //REMOVED,
    // appID: //REMOVED,
  };

if (!firebase.apps.length) firebase.initializeApp(config);

var database = firebase.database().ref("/studyGroups"); // This creates the Firebase database reference
var provider = new firebase.auth.GoogleAuthProvider(); // This creates a Google Authentication Provider for logging in and out


/* This function provides a pop up for the user to log in */
function logIn() {
    firebase.auth().signInWithPopup(provider).then(function (result) {
        console.log("Signed in!");
    }).catch(function (error) {
        console.log("Could not sign in " + error.code);
    });
}

/* This function signs a user out */
function logOut() {
    firebase.auth().signOut().then(function () {
        console.log("Signed out!");
    }).catch(function (error) {
        console.log("Could not sign out " + error.code);
    });
}

// The following code handles authentication states
firebase.auth().onAuthStateChanged(function (user) {
    if (user) { // this means the user is logged in
        // The following lines of code notifies the user that they are signed in 
        document.getElementById("currentSignIn").innerHTML = "You are signed in as " + " <span id=\"thisName\">" + user.displayName + " </span> with the e-mail <span id='thisEmail'>" + user.email + "<span>";
        document.getElementById("currentSignIn").style.color = "green";
        document.getElementById("fillMeWhenSignIn").style.display = "block";

        var searchBox = new google.maps.places.SearchBox(document.getElementById('location'));

        // The following lines retrieve data from Firebase
        database.on("value", function (snapshot) {
            console.log("Database reached!")
            dataRetrieved = snapshot.val();
            dataRetrieved.forEach(function (entry, i) {
                // The following if statement checks if the EduGroup's entered email is the same as the user's.
                // This means that the EduGroup was created by the user, so it should be displayed in the table.
                if ((entry.email == user.email) && dataRetrieved.length > document.getElementById("showEduGroups").rows.length) {
                    var row = document.getElementById("showEduGroups").insertRow(-1);

                    var cell0 = row.insertCell(0);
                    cell0.innerHTML = entry.host;

                    var cell1 = row.insertCell(1);
                    cell1.innerHTML = entry.email;

                    var cell2 = row.insertCell(2);
                    cell2.innerHTML = entry.date;

                    var cell3 = row.insertCell(3);
                    cell3.innerHTML = entry.time;

                    var cell4 = row.insertCell(4);
                    cell4.innerHTML = entry.name;

                    var cell5 = row.insertCell(5);
                    cell5.innerHTML = Object.keys(entry.attendees).length + " out of " + entry.capacity;

                    var cell6 = row.insertCell(6);
                    cell6.innerHTML = entry.location;

                    var cell7 = row.insertCell(7);
                    cell7.innerHTML = entry.subject;

                    var cell8 = row.insertCell(8);
                    cell8.innerHTML = entry.grade;

                    var cell9 = row.insertCell(9);
                    cell9.innerHTML = organizeAttendees(entry.attendees);

                    var cell10 = row.insertCell(10);
                    cell10.innerHTML = "<span onclick=\"deleteMe(" + i + ")\"> X <span>";
                    cell10.className = "removeGroup";
                    cell10.id = "r" + i;
                }
            });

            /* This function runs when the submit button for adding an EduGroup is pressed. It sends
            * an HTTPS request to retrieve coordinates from Google's Geolocation services using the user's
            * specified EduGroup location, then sends the data to Firebase.
            */
            $(document).ready(function () {
                $(document).on('submit', '#myForm2', function () {
                    $.get(genUrl(document.getElementById("myForm2").elements["location"].value), function (data, status) {
                        sendData(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
                    });
                    alert("You created an EduGroup!");
                });
            });
            
            /* This function searches for a valid ID for an EduGroup
            * @return {number} - Returns the first available ID for an EduGroup
            */
            function findValidID() {
                for (var i = 0; i < dataRetrieved.length; i++) {
                    if (!(i in dataRetrieved))
                        return i;
                }
                return dataRetrieved.length;
            }

            /* This function sends the EduGroups data to be added to Firebase
            * @param {number} lat - The EduGroup's latitude coordinate from the HTTPS request
            * @param {number} lng - The EduGroup's longitude coordinate from the HTTPS request
            */
            function sendData(lat, lng) {
                firebase.database().ref("studyGroups/" + (findValidID()) + "/").set({
                    host: user.displayName,
                    email: user.email,
                    name: document.getElementById("myForm2").elements["name"].value,
                    location: document.getElementById("myForm2").elements["location"].value,
                    subject: document.getElementById("myForm2").elements["subject"].value,
                    date: document.getElementById("myForm2").elements["date"].value,
                    time: document.getElementById("myForm2").elements["time"].value,
                    capacity: document.getElementById("myForm2").elements["capacity"].value,
                    grade: document.getElementById("myForm2").elements["grade"].value,
                    otherMessages: document.getElementById("myForm2").elements["otherMessages"].value,
                    attendees: {
                        host: {
                            email: user.email,
                            grade: document.getElementById("myForm2").elements["grade"].value,
                            name: user.displayName,
                            notes: "",
                            school: "your school"
                        },
                    },
                    coordinates: {
                        "lat": lat,
                        "lng": lng
                    },
                });
            }

        }, function (error) {
            console.log("Error: " + error.code);
        });

    } else { // this means the user is logged out
        // The following lines of code notifies the user that they are signed out 
        document.getElementById("fillMeWhenSignIn").style.display = "none";
        document.getElementById("currentSignIn").innerHTML = "You are currently not signed in!";
        document.getElementById("currentSignIn").style.color = "red";

        // This while loop clears any data in the table except for the first row
        while (document.getElementById("showEduGroups").rows.length > 1)
            document.getElementById("showEduGroups").deleteRow(-1);
    }
});

/* This function organizes the attendees from Firebase into a nice HTML list format for easy viewing.
* @param {Object} attendees - The list of attendees from Firebase
* @return {List} - A list of attendees, formatted as an HTML list
*/
function organizeAttendees(attendees) {
    var getValues = Object.values(attendees);
    var listAttendees = [];
    for (var i = 0; i < getValues.length; i++) {
        listAttendees.push(" <li> " + getValues[i].name + " from " + getValues[i].school + " in grade " +
            getValues[i].grade + " with the e-mail " + getValues[i].email + " Included notes: " +
            getValues[i].notes + " <br><br>");
    }
    return listAttendees;
}

/* This function generates the URL for an HTTPS request to retrieve coordinates from a location using Google Maps Geolocation
* @param {string} location - The location from the locations box in the Add an EduGroup form
* @return {string} - The URL to make an HTTPS request for that location
*/
function genUrl(location) {
    return "https://maps.googleapis.com/maps/api/geocode/json?address=" + location.split(' ').join('+') + "&key=AIzaSyANow_dOABv6DsG0qdgPCcUYx6uyuULBgE";
}

/* This function deletes an EduGroup from Firebase
* @param {number} id - The EduGroup's ID to be deleted
*/
function deleteMe(id) {
    firebase.database().ref("studyGroups/" + id + "/").remove();
    location.reload();
}