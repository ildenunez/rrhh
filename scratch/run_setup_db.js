fetch('http://localhost:3000/api/setup-db')
  .then(res => res.json())
  .then(data => {
    console.log("Setup DB result:", data);
  })
  .catch(err => {
    console.error("Error setting up DB:", err);
  });
