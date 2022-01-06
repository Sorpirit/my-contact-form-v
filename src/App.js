import React, { useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import emailjs from 'emailjs-com'
import ReCAPTCHA from 'react-google-recaptcha'
import { Form, Button, Alert, Fade } from 'react-bootstrap'
import configData from './config.json'

function App () {
  const useLimitedRequests = function () {
    const limit = 5
    const timePeriod = 240 * 1000
    const [requests, setRequests] = useState([])

    return [
      requests,
      function () {
        const now = Date.now()

        if (requests.length && (requests[0] < now - timePeriod)) {
          setRequests(requests.slice(1))
        }

        if (requests.length < limit) {
          setRequests([...requests, now])
          return now
        }

        return 0
      }
    ]
  }

  const [response, setResponse] = useState(false)
  const [failed, setFailed] = useState(false)
  const [sendingForm, setSendingForm] = useState(false)
  const [captchaKey, setCaptchaKey] = useState(null)

  const [name, setName] = useState(null)
  const [email, setEmail] = useState(null)
  const [message, setMessage] = useState(null)

  const [, addRequest] = useLimitedRequests()

  const onResponse = (message, successful) => {
    console.log(message)
    setSendingForm(false)
    setResponse(true)
    if(!successful)
      setFailed(true)

    setTimeout(() => {
      setResponse(false)
      setFailed(false)
    }, 2000);
  }

  function CaptchaCheck (value) {
    setCaptchaKey(value)
  }

  const sendEmail = (e) => {
    e.preventDefault()
    setSendingForm(true)

    const data = {
      name: name,
      email: email,
      message: message,
      'g-recaptcha-response': captchaKey
    }

    try {
      if (addRequest() > 0) {
        emailjs.send(configData['SERVICE_ID'], configData['TEMPLATE_ID'], data, configData['USER_ID'])
          .then((result) => {
            onResponse(result.text, true)
          }, (error) => {
            onResponse(error.text, false)
          })
      } else {
        onResponse("Too many requests", false)
      }
    } catch (error) {
      onResponse(error.text, false)
    }

    e.target.reset()
  }

  return (
    <div>

      <h1 className="mb-3 text-center mt-5">Welcome back!</h1>

      {
        response
          ? <Fade in={response}>
        {
          !failed
            ? <Alert className="mb-3 mx-5 bg-success d-flex justify-content-center" variant="sucsses" onClose={() => setResponse(false)} dismissible>
            <Alert.Heading>Email sent! Check your email for a prise.</Alert.Heading>
          </Alert>
            : <Alert className="mb-3 mx-5 bg-danger d-flex justify-content-center text-white text-center" variant="danger" onClose={() => setResponse(false)} dismissible>
            <Alert.Heading>Oh snap! You got an error! Try again later.</Alert.Heading>
          </Alert>
        }
        </Fade>
          : null
      }

      <Form onSubmit={sendEmail} variant="dark">
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" placeholder="Name" onChange={e => setName(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" onChange={e => setEmail(e.target.value)}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="message">
          <Form.Label>Message</Form.Label>
          <Form.Control as="textarea" placeholder="Message" rows={3} onChange={e => setMessage(e.target.value)}/>
        </Form.Group>
        <Button variant="primary" type="submit" disabled={sendingForm || captchaKey == null || email == null || email === ''}>
          {sendingForm ? 'Sending...' : 'Send'}
        </Button>
      </Form>
      <ReCAPTCHA
          className="mb-3 d-flex justify-content-center"
          theme="dark"
          sitekey={configData['RECAPTCHA_SITEKEY']}
          onChange={CaptchaCheck}
        />
    </div>
  )
}

export default App
