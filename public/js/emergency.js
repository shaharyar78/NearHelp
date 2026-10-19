const EMERGENCY_NUMBERS = {
  general: "112",
  ambulance: "112",
  police: "112",
  fire: "112",
};

function confirmAndCall(number, serviceName) {
  const confirmed = window.confirm(
    `Call ${number} for ${serviceName}?`
  );

  if (confirmed) {
    window.location.href = `tel:${number}`;
  }
}

document.querySelectorAll("[data-emergency]").forEach((button) => {
  const service = button.dataset.emergency;
  const number = EMERGENCY_NUMBERS[service];

  if (!number) return;

  button.addEventListener("click", () => {
    confirmAndCall(number, button.dataset.label || service);
  });
});
