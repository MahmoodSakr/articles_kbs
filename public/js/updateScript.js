// handle the update form request
$("document").ready(function () {
  $("#update-btn").on("click", function () {
    bootbox.confirm("Are you sure to update this article", function (result) {
      if (result) {
        $.ajax({
          url: "/articles/update",
          type: "patch",
          cache: false,
          data: {
            _id: $("#_id").val(),
            title: $("#title").val(),
            body: $("#body").val(),
          },
          success: function (response) {
            console.log(response);
            $("#error-group").css("display", "none");
            window.location.href = "/articles";
          },
          error: function (response) {
            $("#error-group").css("display", "block");
            var errors = JSON.parse(response.responseText);
            console.log("errors: ", errors);
            $("#ul_errors").html("");
            var insideHtml = "";
            if (errors instanceof Array) {
              errors.forEach((element) => {
                insideHtml += "<li>" + element.msg + "</li>";
              });
            } else {
              insideHtml += "<li>" + errors.message + "</li>";
            }
            $("#ul_errors").html(insideHtml);
          },
        });
      }
    });
  });
});
