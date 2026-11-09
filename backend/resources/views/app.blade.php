<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>PetBook — Pet care, booked.</title>
    <link rel="stylesheet" href="{{ asset('app/app.css') }}">
</head>
<body>
    <div id="app">
        <div class="boot-screen">
            <div class="brand-mark">PetBook<span>.</span></div>
            <p>Loading your pet care workspace…</p>
        </div>
    </div>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
    <script src="{{ asset('app/app.js') }}"></script>
</body>
</html>
