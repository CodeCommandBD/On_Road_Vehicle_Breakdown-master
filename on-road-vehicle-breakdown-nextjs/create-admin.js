async function createAdmin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Admin',
        email: 'admin@quickservice.com',
        password: 'admin123',
        role: 'admin'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@quickservice.com');
      console.log('Password: admin123');
    } else {
      console.error('❌ Failed to create admin:', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('Make sure the project server is running at http://localhost:3000');
  }
}

createAdmin();
