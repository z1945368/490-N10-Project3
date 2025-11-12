const collapseSuspectLabelButton = document.getElementById("suspectLabel#");
const collapseSuspectReports = document.getElementById("suspectReports#");

collapseSuspectLabelButton.addEventListener(
    "click",
    function(){
        collapseSuspectReports.classList.toggle("fullExtendedArea");
    }

)