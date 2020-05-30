$(document).ready(function () {
  $("#delete-btn").on("click", (e) => {
    bootbox.confirm("Delete this article ? ", function (result) {
      if (result) {
        $a = $(e.target); // get the a element object
        const id = $a.attr("data-id");
        $.ajax({
          type: "Delete",
          url: "/articles/delete",
          data: { id: id },
          success: function (response) {
            console.log(`response ${response}`);
            window.location.href = "/articles";
          },
          error: function (response) {
            errors = JSON.parse(response.responseText);
            bootbox.alert(errors.message);
          },
        });
      }
    });
  });
});
