const symptomForm = document.getElementById("symptomForm");

symptomForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const description = document.getElementById("symptomDescription").value.trim();
  const resultBox = document.getElementById("guidanceResult");
  const button = document.getElementById("guidanceButton");

  if (!description) {
    resultBox.textContent = "Please describe what you have been experiencing.";
    return;
  }

  button.disabled = true;
  button.textContent = "Preparing guidance…";

  try {
    const response = await fetch("/api/symptoms/guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to prepare guidance.");

    const card = document.createElement("div");
    card.className = `result-card ${data.result.level === "urgent" ? "urgent" : ""}`;
    const heading = document.createElement("h3");
    heading.textContent = data.result.title;
    const paragraph = document.createElement("p");
    paragraph.textContent = data.result.message;
    card.append(heading, paragraph);
    resultBox.replaceChildren(card);
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Explore guidance →";
  }
});

document.getElementById("resourceSearch").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();
  document.querySelectorAll(".resource-card").forEach((card) => {
    card.style.display = !query || card.dataset.search.includes(query) ? "" : "none";
  });
});
