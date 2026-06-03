<!DOCTYPE html>
<html lang="en">
<head><?php foreach($dataprofil as $data_lembaga){ ?> <?php } ?>
    <title><?php echo $data_lembaga->nama_lembaga ?></title>
    <!-- HTML5 Shim and Respond.js IE11 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!-- Meta -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="description" content="" />
    <meta name="keywords" content="">
    <meta name="author" content="HAINUR CAHYA UTAMA" />
    <!-- Favicon icon -->
    <link rel="icon" href="<?php echo base_url() ?>upload/<?php echo $data_lembaga->logo ?>" type="image/x-icon">
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/plugins/dataTables.bootstrap4.min.css">
    <!-- pnotify-custom css -->
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/plugins/PNotifyBrightTheme.css">
    <!-- prism css -->
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/plugins/prism-coy.css">
    <!-- ekko-lightbox css -->
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/plugins/ekko-lightbox.css">
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/plugins/lightbox.min.css">
    <!-- select2 css -->
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/plugins/select2.min.css">
    <!-- vendor css -->
    <link rel="stylesheet" href="<?php echo base_url() ?>assets/css/style.css">
    <script src="<?php echo base_url() ?>assets/js/Chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/froala-editor/4.0.16/css/froala_editor.pkgd.min.css" integrity="sha512-vuMfJiP1mynSaBWEsouDLOvvRmMeib2s936m2d+OalK9nYIzrPmSM6kOxBLoydHWLjWSZY99Yx1zqnYSR2nqvQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/froala-editor/4.0.16/js/froala_editor.pkgd.min.js" integrity="sha512-cdPreUNlEBCU2l+Z2oMzxKbfATPuqSK8scXsAw6h/AEzmXhbxd8wxFCn5s386wyEv37ljkKMRXhzGaisKPPNmQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>

