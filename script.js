 // jQuery elements
    const loadingElement = $('#loading');
    const requestPayloadElement = $('#requestPayload');
    const resultContentElement = $('#resultContent');
    const apiKeyInput = $('#apiKeyInput'); // Added API Key input

    // Default payloads for each endpoint
    const defaultPayloads = {
      '/v1/completions': {
        model: 'gpt-3.5-turbo',
        prompt: 'Say this is a test',
        max_tokens: 2000,
        temperature: 0,
      },
      '/v1/chat/completions': {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say this is a test!' },
          { role: 'assistant', content: 'Sure, this is a test.' },
        ],
      },
      '/chat/completions': {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say this is a test!' },
          { role: 'assistant', content: 'Sure, this is a test.' },
        ],
      },
    };

    // Initialize default payload for the first endpoint
    const defaultEndpoint = '/v1/completions';
    requestPayloadElement.text(JSON.stringify(defaultPayloads[defaultEndpoint], null, 2));

    // Function to test API for a specific endpoint
    function testApi(endpoint) {
      const baseUrl = $('#baseUrlInput').val();
      const payloadText = requestPayloadElement.text().trim();
      const apiKey = apiKeyInput.val().trim(); // Get API Key

      if (!payloadText) {
        alert('Please enter a valid JSON payload.');
        return;
      }

      try {
        const payload = JSON.parse(payloadText);

        showLoading();

        // AJAX request to the API with API Key in the headers
        $.ajax({
          type: 'POST',
          url: baseUrl + (endpoint || ''),
          contentType: 'application/json',
          data: JSON.stringify(payload),
          headers: {
            'Authorization': `Bearer ${apiKey}`, // Add API Key to headers
          },
          success: function (data) {
            updateSharedResult(data);
          },
          error: function (xhr, status, error) {
            console.error('Error:', xhr.status, xhr.statusText);
          },
          complete: hideLoading
        });
      } catch (e) {
        alert('Invalid JSON payload. Please check your input.');
      }
    }

    // Function to update the shared result content
    function updateSharedResult(data) {
      resultContentElement.text(JSON.stringify(data, null, 2));
    }

    // Function to show loading indicator
    function showLoading() {
      loadingElement.html('Loading...');
      loadingElement.show();
    }

    // Function to hide loading indicator
    function hideLoading() {
      loadingElement.hide();
    }

    // Set default payload when selecting an endpoint
    $('.endpointCell').click(function () {
      const endpoint = $(this).attr('data-endpoint');
      requestPayloadElement.text(JSON.stringify(defaultPayloads[endpoint], null, 2));
    });

    // Add test buttons next to each endpoint
    $('.endpointCell').each(function () {
      const endpoint = $(this).attr('data-endpoint');
      const button = $('<button>Test Endpoint</button>');
      button.click(function () {
        testApi(endpoint);
      });
      $(this).append(button);
    });