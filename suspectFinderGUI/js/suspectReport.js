// Expand/Collapse list of reports for a given suspect
const collapseSuspectLabelButton = document.getElementsByClassName("suspectLabel");
const collapseSuspectReports = document.getElementById("suspectReports#");

collapseSuspectLabelButton.addEventListener( // Listener to expand/collapse the report list.
    "click",
    function(){
        collapseSuspectReports.classList.toggle("extendableAreaExpand");
    }
);

// Open/Close pop up window for report
const reportLabelButton = document.getElementById("report#1");
const popUpReturnButton = document.getElementById("returnButton");
const popUpWindow = document.getElementById("reportPopUp");


reportLabelButton.addEventListener( // Listener to open report pop up
    "click",
    function (){
        popUpWindow.showModal(); // Open pop up on click
    }
);

popUpReturnButton.addEventListener( // Listener to close the pop up
    "click",
    function(){
        popUpWindow.close(); // Close pop up on click
    } 
);
