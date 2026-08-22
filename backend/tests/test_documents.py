from conftest import auth_headers


def test_upload_list_get_delete_document(authorized_client, sample_pdf_bytes):
    client, headers = authorized_client
    upload_response = client.post(
        "/api/documents/upload",
        headers=headers,
        files={"file": ("contract.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert upload_response.status_code == 201
    document_id = upload_response.json()["document_id"]

    list_response = client.get("/api/documents", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    get_response = client.get(f"/api/documents/{document_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == document_id

    download_response = client.get(f"/api/documents/{document_id}/download", headers=headers)
    assert download_response.status_code == 200
    assert download_response.headers["content-type"].startswith("application/pdf")

    delete_response = client.delete(f"/api/documents/{document_id}", headers=headers)
    assert delete_response.status_code == 200


def test_cross_user_document_access_returns_404(client, sample_pdf_bytes):
    first_headers = auth_headers(client, "user1@example.com")
    second_headers = auth_headers(client, "user2@example.com")

    upload_response = client.post(
        "/api/documents/upload",
        headers=first_headers,
        files={"file": ("contract.pdf", sample_pdf_bytes, "application/pdf")},
    )
    document_id = upload_response.json()["document_id"]

    response = client.get(f"/api/documents/{document_id}", headers=second_headers)
    assert response.status_code == 404
