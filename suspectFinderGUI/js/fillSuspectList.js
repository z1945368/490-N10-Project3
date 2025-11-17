// Link JSON to files
var suspectReports = new Map();

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

        reports.forEach(report => {
            suspectReportList.appendChild(buildReportListItem(report));
        });

        suspectLabelButton.addEventListener(
            "click",
            function (){
                suspectReportExpandable.classList.toggle("extendableAreaExpand");
            }
        );

    });

}

function getPersonsFromJSON(data) { // Fill the map of suspects from the data
    var personMap = new Map();

    data.forEach(report => {
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

// function checkForName(suspect, names){ // Checks for the name in a report
//     var found = false;
//     names.forEach( individual => {
//         if (!found && individual == suspect) {
//             found = true;
//         }
//     });
//     return found;
// }

// function getReportsFromName(name, data){ // Gets the list of reports associate with a suspect
//     let reportList =[];
//     data.forEach(report => {
//         if (checkForName(name, report.PERSONS)){
//             report.push(report.ID);
//         }
//     });
//     return reportList;
// }

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
