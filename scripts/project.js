/* Shared project-detail loader. Each /projects/<slug>/ page resolves its copy
   from content/projects.json and its long-form body from content/projects/. */
(function () {
  "use strict";

  var parts = location.pathname.replace(/\/+$/, "").split("/");
  var slug = parts[parts.length - 1] || "";

  fetch("../../content/projects.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load projects");
      return response.json();
    })
    .then(function (rows) {
      var project = rows.filter(function (item) { return item.slug === slug; })[0];
      if (!project) throw new Error("Project not found");

      document.title = project.title + " — Sheel Shah";
      document.getElementById("p-title").textContent = project.title;
      document.getElementById("p-stack").textContent = (project.stack || []).join(" · ");

      var repo = document.getElementById("p-repo");
      if (project.repo) repo.setAttribute("href", project.repo);

      return fetch("../../" + project.body);
    })
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load project copy");
      return response.text();
    })
    .then(function (markdown) {
      var html = markdown.trim().split(/\n{2,}/).map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph.replace(/\n/g, " ")) + "</p>";
      }).join("");
      document.getElementById("p-body").innerHTML = html;
    })
    .catch(function () {
      document.getElementById("p-title").textContent = "Project not found";
      document.getElementById("p-body").innerHTML =
        '<p>Try <a class="inline" href="https://github.com/shahxsheel">GitHub</a> or head <a class="inline" href="../">back to Projects</a>.</p>';
    });

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character];
    });
  }
})();
