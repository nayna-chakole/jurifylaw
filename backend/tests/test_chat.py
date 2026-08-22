def test_chat_session_and_message_flow(authorized_client, sample_pdf_bytes):
    client, headers = authorized_client
    upload_response = client.post(
        "/api/documents/upload",
        headers=headers,
        files={"file": ("contract.pdf", sample_pdf_bytes, "application/pdf")},
    )
    document_id = upload_response.json()["document_id"]

    session_response = client.post(
        "/api/chat/sessions",
        headers=headers,
        json={"title": "Contract Questions", "document_id": document_id},
    )
    assert session_response.status_code == 201
    session_id = session_response.json()["id"]

    message_response = client.post(
        f"/api/chat/sessions/{session_id}/messages",
        headers=headers,
        json={"content": "What is the main delivery obligation?"},
    )
    assert message_response.status_code == 201
    assert message_response.json()["assistant_message"]["content"] == "Mock RAG response based on the current session context."
