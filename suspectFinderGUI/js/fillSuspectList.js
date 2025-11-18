// Link JSON to files
var suspectReports = new Map();
var fullReports = new Map();

async function getJSONData(data) { // Get JSON data and send to html file
    const listBody = document.getElementById("suspectList");
    const suspectArray = getSuspectList(getPersonsFromJSON(data));

    setSuspectCount(suspectArray.length);

    suspectArray.forEach(([name,value]) => {
        listBody.appendChild(buildSuspectItem(name,value));
    });
}

function getSuspectList(personMap){ // Gets the list of the suspects
    var suspectListArray = Array.from(personMap);

    suspectListArray.sort((a,b) => b[1] - a[1]);

    // suspectListArray = suspectListArray.filter(([name,value]) => value >= 2); // Remove all the suspects with a single report.

    return suspectListArray;
}

function buildSuspectItem(key,value){ // Returns the formatted suspectItem
    const suspectItem = document.createElement("li");
    suspectItem.id = `suspectListItem${key}`;
    
    suspectItem.innerHTML = `
        <div class="collapsible" id="collapsible${key}">
            <div class="displayedArea">
                <label class="suspectLabel"> ${key} (${value} report(s)) </label>
                <div class="suspectButtons"> 
                    <button class="suspectButton" id="saveSuspectButton">Save</button>
                    <button class="suspectButton" id="removeSuspectButton">Remove</button>
                </div>
            </div>    
            <div class="extendableAreaCollapse" id="suspectReports${key}">
                <ul class="reportList" id="reportList${key}">
                </ul>
            </div>
        </div>
    `;
    return suspectItem;
}

function buildReportListItem(reportID){
    const reportItem = document.createElement("li");

    reportItem.id = `report${reportID}`;
    reportItem.className = "reportListItem";
    reportItem.innerHTML = `Report: ${reportID}`;

    return reportItem;
}

function addButtonListenersToSuspects(){
    suspectReports.forEach((reports, key)=>{
        const suspectLabelButton = document.getElementById(`suspectListItem${key}`);
        const suspectReportExpandable = document.getElementById(`suspectReports${key}`);
        const suspectReportList = document.getElementById(`reportList${key}`);

        suspectLabelButton.addEventListener( // Turns label into drop down menu
            "click",
            function (){
                suspectReportExpandable.classList.toggle("extendableAreaExpand");
            }
        );

        reports.forEach(report => {
            suspectReportList.appendChild(buildReportListItem(report));
            const reportLabelButton = document.getElementById(`report${report}`);
            const popUpReturnButton = document.getElementById("returnButton");
            const popUpWindow = document.getElementById("reportPopUp");
            
            reportLabelButton.addEventListener(
                "click",
                function (){
                    fillReportPopUp(fullReports.get(report));
                    popUpWindow.showModal(); // Open pop up on click
                }
            );

            popUpReturnButton.addEventListener( // Listener to close the pop up
                "click",
                function(){
                    popUpWindow.close(); // Close pop up on click
                } 
            );
        });
    });


}

function fillReportPopUp(report){
    const popUpTitle = document.getElementById("reportTitleID");
    const popUpDate = document.getElementById("reportDate");
    const popUpRef = document.getElementById("referencedReport");
    const popUpSource = document.getElementById("reportSource");
    const popUpIndividuals = document.getElementById("reportIndividuals");
    const popUpPlaces = document.getElementById("reportPlaces");
    const popUpDates = document.getElementById("reportDates");
    const popUpOrgs = document.getElementById("reportOrgs");
    const popUpDescript = document.getElementById("reportDescription");

    popUpTitle.textContent = (`Report ${report.ID}`);
    popUpDate.textContent = (report.REPORTDATE);
    if (report.REFERENCEID){
        popUpRef.textContent = (report.REFERENCEID);
    }
    popUpSource.textContent = (report.REPORTSOURCE);
    popUpIndividuals.textContent = (report.PERSONS);
    popUpPlaces.textContent = (report.PLACES);
    popUpDates.textContent = (report.DATES);
    popUpOrgs.textContent = (report.ORGANIZATIONS);
    popUpDescript.textContent = (report.REPORTDESCRIPTION);
}

function getPersonsFromJSON(data) { // Fill the map of suspects from the data
    var personMap = new Map();

    data.forEach(report => {
        fullReports.set(report.ID,report);
        report.PERSONS.forEach(person => {
            if (!personMap.has(person)) {
                personMap.set(person,1);
                suspectReports.set(person,[report.ID]);
            }
            else {
                personMap.set(person, personMap.get(person)+1);
                suspectReports.get(person).push(report.ID);
            }
        });
    });

    return personMap
}

function setSuspectCount(suspectCount){ // Set the displayed counter of suspects
    const suspectCountLabel = document.getElementById("suspectCounter");

    suspectCountLabel.textContent = suspectCount;
}

async function run(){ // Essentially the main function
    const file = await fetch("/suspectFinderGUI/json/reports.json");
    const data = await file.json();

    getJSONData(data);
    addButtonListenersToSuspects();
}

run();
