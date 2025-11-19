// Link JSON to files
var suspectReports = new Map();
var fullReports = new Map();
var savedSuspect = new Set();

async function getJSONData(data) { // Get JSON data and send to html file
    const listBody = document.getElementById("suspectList");
    const suspectArray = getSuspectList(getPersonsFromJSON(data));

    setSuspectCount(suspectArray.length);

    suspectArray.forEach(([name,value]) => {
        listBody.appendChild(buildSuspectItem(name,value.length));
    });
}

function getSuspectList(personMap){ // Gets the list of the suspects
    var suspectListArray = Array.from(personMap);

    suspectListArray.sort((a,b) => b[1].length - a[1].length);

    return suspectListArray;
}

function buildSuspectItem(key,value){ // Returns the formatted suspectItem
    const suspectItem = document.createElement("li");
    suspectItem.id = `suspectListItem${key}`;
    suspectItem.className = 'suspectListItem';
    
    suspectItem.innerHTML = `
        <div class="collapsible" id="collapsible${key}">
            <div class="displayedArea">
                <label class="suspectLabel"> ${key} (${value} report(s)) </label>
                <div class="suspectButtons"> 
                    <button class="suspectButton" id="saveSuspectButton${key}">Save</button>
                    <button class="suspectButton" id="removeSuspectButton${key}">Remove</button>
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

function removeSuspectItem(key){ // Removes the suspect list item given the key
    document.getElementById(`suspectListItem${key}`).remove();
    suspectReports.delete(key);
    setSuspectCount(suspectReports.size);
}

function addButtonListenersToSuspects(){ // Add button listeners to buttons
    const filterSuspectsButton = document.getElementById("filterSuspectButton");
    const suspectString = "suspectListItem";
    filterSuspectsButton.addEventListener(
        "click",
        function (){
            const suspectListElements = Array.from(document.getElementsByClassName(suspectString));
            suspectListElements.forEach(collapsible => {
                if (!savedSuspect.has(collapsible.id)){
                    var tempString = collapsible.id;
                    tempString = tempString.substring(suspectString.length);
                    removeSuspectItem(tempString);

                }
            });
        }
    );

    suspectReports.forEach((reports, key) => {
        const suspectLabelButton = document.getElementById(`suspectListItem${key}`);
        const suspectReportExpandable = document.getElementById(`suspectReports${key}`);
        const suspectReportList = document.getElementById(`reportList${key}`);
        const suspectSaveButton = document.getElementById(`saveSuspectButton${key}`);
        const suspectRemoveButton = document.getElementById(`removeSuspectButton${key}`);

        suspectLabelButton.addEventListener( // Turns label into drop down menu
            "click",
            function (){
                suspectReportExpandable.classList.toggle("extendableAreaExpand");
            }
        );

        suspectSaveButton.addEventListener( // Saves a suspect to a list
            "click",
            function (){
                savedSuspect.add(`suspectListItem${key}`);
            }
        );

        suspectRemoveButton.addEventListener( // Removes a list item from the suspect list
            "click",
            function (){
                removeSuspectItem(key);
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

function fillReportPopUp(report){ // Fills the data for the report pop up
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

function aliases(name){ // Function handles names with aliases (Alias names were obtained by ai scanning for aliases)
    var suspect = name;

    switch (suspect) {
        case "Abu Hafs":    
        case "Mehdi Rafiki":
            suspect = "Abdillah Zinedine"
            break;
        case "Omar Blakely":    
            suspect = "Rifai Qasim";
            break;
        case "Fr. Augustin Dominique":    
            suspect = "Abdal al Hawsawi";
            break;
        case "Shadi abu Hoshar":    
            suspect = "Mousa Salah";
            break;
        case "Reginald Cooper":    
            suspect = "Mahmud al-Dahab";
            break;
        case "Ralph Bean":    
            suspect = "Raeed Beandali";
            break;
    
        default:
            break;    
    }
    return suspect;
}

function getPersonsFromJSON(data) { // Fill the map of suspects from the data
    var personMap = new Map();
    data.forEach(report => {
        fullReports.set(report.ID,report);
        report.PERSONS.forEach(suspect => {
            const person = aliases(suspect);
            if (!personMap.has(person)) {
                personMap.set(person,1);
                suspectReports.set(person,[report.ID]);
            }
            else {
                personMap.set(person, personMap.get(person)+1);
                if(!suspectReports.get(person).includes(report.ID)){
                    suspectReports.get(person).push(report.ID);
                }
            }
        });
    });

    return suspectReports
}

function setSuspectCount(suspectCount){ // Set the displayed counter of suspects
    const suspectCountLabel = document.getElementById("suspectCounter");

    suspectCountLabel.textContent = suspectCount;
}

async function run(){ // Essentially the main function
    const file = await fetch("reports.json");
    const data = await file.json();

    getJSONData(data);
    addButtonListenersToSuspects();
}


 ///////////////////////////////What they want to do /////////////////////////////////

// Categories and keywords
const planKeywords = {

    Travel: [
      "flight","airport","arrived","departed","travel",
      "ticket","rented","car","bus","crossing","airline"
    ],
  
    IdentityFraud: [
      "passport","alias","identity","license","fake",
      "forged","fraud","documents","id","impersonat"
    ],
  
    Explosives: [
      "semtex","explosive","c-4","detonator","bomb",
      "chemical weapons","weapon","materials"
    ],
  
    SuspiciousFinance: [
      "bank","account","deposit","payment","funding",
      "money","transfer","bmi","diamonds",
      "scholarship","cash","withdrawal"
    ],
  
    OrgLinks: [
      "hezbollah","militant","Taliban","Al Qaeda", "radical","organization","group","training"
    ],
  
    Evasion: [
      "abandoned","never returned","vacant",
      "unoccupied","missing","disappeared"
    ],
  
    IllegalEntry: [
      "illegal entry","border","smuggling",
      "crossed","undocumented","entry"
    ],
  
    Surveillance: [
      "scouting","observing","surveillance",
      "diagrams","maps","photographs","target"
    ],
  
    Communication: [
      "message","call","note","contact","instructions"
    ]
  };
  
 

function analyzeSuspectPlan(suspectName, suspectReports, fullReports, planKeywords) {

//suspectReports:	suspect name ->	list of report IDs	
//fullReports	report ID	 -> full report object
// counteres category -> frequency
    let counters = {};

    // Initialize counters
    for (let cat in planKeywords) {
        counters[cat] = 0;
    }
    // reportIDs Array of name strings
    const reportIDs = suspectReports.get(suspectName);

    reportIDs.forEach(reportID => {
        const report = fullReports.get(reportID);
        const text = report.REPORTDESCRIPTION.toLowerCase();

        for (let category in planKeywords) {
            
            let categoryScore = 0;

            planKeywords[category].forEach(keyword => {
                if (text.includes(keyword)) {
                    categoryScore += 1;   // DISTINCT keyword found
                }
            });
        // Add distinct keyword count
        if (categoryScore > 0) {
         counters[category] += categoryScore;
    }
        }
    });

    return counters;
}


document.getElementById("planButton").addEventListener("click", function () {
    //output will hold the final report of what each suspect will do
    let output = "<h2>Suspect Plans</h2>";

    //loop through all the suspects and call analyzeSuspectPlan 
    suspectReports.forEach((reportList, suspectName) => {
        const plan = analyzeSuspectPlan(
            suspectName,
            suspectReports,
            fullReports,
            planKeywords
        );

        // Format readable output <p> category frequency, catefory frequency ... </p>
        let line = `<p><b>${suspectName}</b> : `;
        let parts = [];

        for (let category in plan) {
            if (plan[category] > 0) {
                parts.push(`${category} (${plan[category]})`);
            }
        }

        line += parts.join(", ");
        line += "</p>";

        output += line;
    });

    document.getElementById("planResults").innerHTML = output;

    const suspectPlans = document.getElementById("planResults");
    suspectPlans.scrollIntoView({behavior:"smooth"}); // Scrolls to text location of element.

 
});

  ///////////////////////////////End What they want to do /////////////////////////////////

  run();