def test_analysis_flow_with_mocked_ai(authorized_client, sample_pdf_bytes):
    client, headers = authorized_client
    upload_response = client.post(
        "/api/documents/upload",
        headers=headers,
        files={"file": ("contract.pdf", sample_pdf_bytes, "application/pdf")},
    )
    document_id = upload_response.json()["document_id"]

    start_response = client.post(f"/api/analysis/{document_id}/start", headers=headers)
    assert start_response.status_code == 202

    status_response = client.get(f"/api/analysis/{document_id}/status", headers=headers)
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "COMPLETED"

    result_response = client.get(f"/api/analysis/{document_id}/result", headers=headers)
    assert result_response.status_code == 200
    body = result_response.json()
    assert body["status"] == "COMPLETED"
    assert body["summary"] == "Mock analysis completed successfully."
    assert len(body["clauses"]) == 2
