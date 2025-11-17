// Link JSON to files
var personMap = new Map();

async function getJSONData() {
    const listBody = document.getElementById("suspectList");
    const suspectArray = getSuspectList();

    suspectArray.forEach(([key,value]) => {
        listBody.appendChild(buildSuspectItem(key,value));
    });
}

function getSuspectList(){ // Gets the list of the suspects
    var suspectListArray = Array.from(personMap);

    suspectListArray.sort((a,b) => b[1] - a[1]);

    return suspectListArray;
}

function buildSuspectItem(key,value){ // Returns the formatted suspectItem
    const suspectItem = document.createElement("li");
    suspectItem.id = "suspectListItem"+key;
    
    suspectItem.innerHTML = `
        <div class="collapsible" id="collapsible${key}">
            <div class="displayedArea">
                <label class="suspectLabel"> ${key} (${value} report(s)) </label>
                <div class="suspectButtons"> 
                    <button class="suspectButton" id="saveSuspectButton">Save</button>
                    <button class="suspectButton" id="removeSuspectButton">Remove</button>
                </div>
            </div>    
            <div class="extendableAreaCollapse" id="suspectReports#">
                <ul class="reportList" id="reports${key}">
                    <li class="reportListItem" id="report#1">Report #</li>
                    <li class="reportListItem" id="report#2">Report #</li>
                    <li class="reportListItem" id="report#3">Report #</li>
                </ul>
            </div>
        </div>
    `;
    return suspectItem;
}

function getPersonsFromJSON(data) { // Fill the map of suspects from the data
    data.forEach(report => {
        report.PERSONS.forEach(person => {
            if (!personMap.has(person)) {
                personMap.set(person,1);
            }
            else {
                personMap.set(person, personMap.get(person)+1);
            }
        });
    });

}

function checkForName(suspect, names){ // Checks for the name in a report
    var found = false;
    names.forEach( individual => {
        if (!found && individual == suspect) {
            found = true;
        }
    });
    return found;
}

function getReportsFromName(name, data){ // Gets the list of reports associate with a suspect
    let reportList =[];
    data.forEach(report => {
        if (checkForName(name, report.PERSONS)){
            report.push(report.ID);
        }
    });
    return reportList;
}

function setSuspectCount(){ // Set the displayed counter of suspects
    const suspectCountLabel = document.getElementById("suspectCounter");

    suspectCountLabel.textContent = personMap.size;
}

async function run(){
    const file = await fetch("/suspectFinderGUI/json/reports.json");
    const data = await file.json();

    getPersonsFromJSON(data);
    getJSONData();
    setSuspectCount();
}


run();
