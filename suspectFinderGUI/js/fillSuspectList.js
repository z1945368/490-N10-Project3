// Link JSON to files
async function getJSONData() {
    
    const file = await fetch("/suspectFinderGUI/json/reports.json");
    const data = await file.json();

    const listBody = document.getElementById("suspectList");

    data.forEach(report => {
        console.log(report.DESCRIPTION)
        const suspectItem = document.createElement("li");
        suspectItem.id = "suspectListItem"+report.ID;
        
        suspectItem.innerHTML = `
            <div class="collapsible">
                <div class="displayedArea">
                    <label class="suspectLabel" id="suspectLabel#">` + report.PERSONS[0] + `</label>
                    <div class="suspectButtons"> 
                        <button class="suspectButton" id="saveSuspectButton">Save</button>
                        <button class="suspectButton" id="removeSuspectButton">Remove</button>
                    </div>
                    
                </div>    
                <div class="extendableAreaCollapse" id="suspectReports#">
                    <ul class="reportList">
                        <li class="reportListItem" id="report#1">Report ` + report.ID + `</li>
                        <li class="reportListItem" id="report#2">Report #</li>
                        <li class="reportListItem" id="report#3">Report #</li>
                    </ul>
                </div>
            </div>
        `;
        listBody.appendChild(suspectItem);
    });
    
}

getJSONData();