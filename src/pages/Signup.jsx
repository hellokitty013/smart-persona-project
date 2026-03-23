import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../services/auth'
import '../App.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    birthDate: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // try register
    const { username, email, password, firstName, lastName, birthDate } = formData
    const res = await registerUser({ username, email, password, firstName, lastName, birthDate })
    if (!res.ok) {
      alert(res.message || 'Registration failed')
      return
    }
    // success -> store credentials so the login form can be pre-filled, then go back to home
    try { localStorage.setItem('lastRegistered', JSON.stringify({ identifier: username || email, password })) } catch (e) {}
    navigate('/')
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Your Account</h1>
      <h5 className="signup-subtitle">YOUR PERSONAL INFORMATION</h5>
      <p className="mandatory-text">(*) All fields mandatory</p>

      <Form className="signup-form" onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Control
                type="text"
                name="username"
                placeholder="*Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Control
                type="date"
                name="birthDate"
                placeholder="mm/dd/yyyy"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Control
                type="text"
                name="firstName"
                placeholder="*First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Control
                type="text"
                name="lastName"
                placeholder="*Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Control
                type="email"
                name="email"
                placeholder="*Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-4">
              <Form.Control
                type="password"
                name="password"
                placeholder="*Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="text-center">
          <Button 
            variant="dark"
            type="submit"
            className="create-button"
          >
            Create Account
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default Signup;
