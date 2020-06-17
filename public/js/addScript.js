$(document).ready(function () {
  $("#add-btn").on("click", function () {
    $.ajax({
      type: "post",
      url: "/articles/add",
      data: {
        title: $("#title").val(),
        author: $("#autshor").val(),
        body: $("#body").val(),
      },
      success: function (response) {
        $("#error-group").hide();
        console.log(response);
        window.location.href = "/articles"; // redirect from here
      },
      error: function (response) {
        $("#error-group").show();
        $("#ul_errors").html("");
        alert("Data is not added");
        var insideHtml = "";
        errors = JSON.parse(response.responseText);
        console.log(errors);

        if (errors instanceof Array) {
          errors.forEach((element) => {
            insideHtml += "<li>" + element.msg + "</li>";
          });
        } else {
          insideHtml = "<li>" + errors.message + "</li>";
        }
        $("#ul_errors").html(insideHtml);
      },
    });
  });
});
