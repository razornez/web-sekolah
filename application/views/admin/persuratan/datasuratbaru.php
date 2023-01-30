<!-- [ Main Content ] start -->
<div class="pcoded-main-container">
    <div class="pcoded-content">
        <!-- [ breadcrumb ] start -->
        <div class="page-header">
            <div class="page-block">
                <div class="row align-items-center">
                    <div class="col-md-12">
                        <div class="page-header-title">
                            <h5 class="m-b-10">Surat [BARU] </h5>
                        </div>
                        <ul class="breadcrumb">
                            <li class="breadcrumb-item"><a href="index.html"><i class="feather icon-home"></i></a></li>
                            <li class="breadcrumb-item"><a href="#!">Sekolah</a></li>
                            <li class="breadcrumb-item"><a href="#!">Surat [BARU] </a></li>
                        </ul>
                    </div>
                </div>        
            </div>
        </div>


        <!-- [ breadcrumb ] end -->
        <!-- [ Main Content ] start -->
        <div class="row">
            <!-- subscribe start -->
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>Daftar Surat [BARU]</h5>
                        
                        <?php if($this->session->flashdata('hapus_berhasil')){ ?>  
                            <div class="col-xl-6 alert alert-danger">  
                              <a href="#" class="close" data-dismiss="alert">&times;</a>  
                              <strong></strong> <?php echo $this->session->flashdata('hapus_berhasil'); ?>  
                            </div>  
                          <?php } ?>  

                          <?php if($this->session->flashdata('tambah_berhasil')){ ?>  
                            <div class="col-xl-6 alert alert-info">  
                              <a href="#" class="close" data-dismiss="alert">&times;</a>  
                              <strong></strong> <?php echo $this->session->flashdata('tambah_berhasil'); ?>  
                            </div>  
                          <?php } ?>  

                          <?php if($this->session->flashdata('import_berhasil')){ ?>  
                            <div class="col-xl-6 alert alert-info">  
                              <a href="#" class="close" data-dismiss="alert">&times;</a>  
                              <strong>Proses Selesai </strong> <?php echo $this->session->flashdata('import_berhasil'); ?>  
                            </div>  
                          <?php } ?>  
                    </div>

                    <div class="card-body">
                        <div class="row align-items-center m-l-0">
                            <div class="col-sm-6">
                            </div>
                            <div class="col-sm-6 text-right">
                                <button onclick="insertContent()" class="btn btn-info btn-sm btn-round has-ripple" data-toggle="modal" data-target="#modal-report"><i class="fas fa-plus-circle"></i> Tambah</button>
                            </div>
                        </div>
                       
                        <div class="table-responsive">
                            <table id="report-table" class="table table-bordered table-striped mb-0">
                                <thead>
                                    <tr class="text-center">
                                        <th>No</th>
                                        <th>Jenis Surat</th>
                                        <th>Content</th>
                                        <th>Tgl Buat</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody><?php $no = 1; foreach($datasuratbaru as $res){ ?>
                                    <tr>
                                        <td class="text-center"><?php echo $no++ ?></td>
                                        <td class="text-center"><?php echo $res->title ?></td>
                                        <td>
                                        <div class="d-inline-block align-middle">
                                                <div class="d-inline-block">
                                                    <h6 class="m-b-0"><?php echo substr(strip_tags($res->content),100, 120) ?>...</h6>
                                                    <p class="m-b-0"></p> 
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-center"><?php echo date($res->created_at) ?></td>
                                
                                        <td class="text-center">
                                            <a target="_blank" href="<?php echo base_url() ?>master/print_suratbaru/<?php echo $res->id ?>" class="btn btn-icon btn-info btn-sm"><i class="feather icon-printer"></i></a>
                                            <a href="<?php echo base_url() ?>master/hapussuratbaru/<?php echo $res->id ?>" class="btn btn-icon btn-danger btn-sm tombol-hapus"><i class="feather icon-trash-2"></i></a>
                                        </td>
                                    </tr>



                                    <?php } ?>
                                 
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <!-- subscribe end -->
        </div>
        <!-- [ Main Content ] end -->
    </div>


<div class="modal fade" id="modal-report" tabindex="-1" role="dialog" aria-labelledby="myExtraLargeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl" style="width:60%">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Isi Surat Keterangan Aktif</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="<?php echo base_url() ?>master/simpansuratbaru" method="post" enctype="multipart/form-data" role="form">
                    <div class="row">

                        
                        <div class="col-sm-12">
                            <div class="form-group">
                                <label class="col-sm-3"><strong>Masukan Nama Surat</strong></label>
                                <div class="col-sm-9">
                                    <input type="text" name="title" class="form-control" value="" placeholder="contoh : Surat izin kegiatan">
                                </div>
                            </div>
                        </div>

                        <div class="col-sm-12">
                            <div class="form-group">
                                <label class="col-sm-3"><strong>Gunakan Template</strong></label>
                                <div class="col-sm-9">
                                    <select class="form-control" id="template_surat" name="template_surat" onchange="onChangeTemplate(this.value)">
                                        <option value="" class="font-weight-bolder">--PILIH SURAT--</option>
                                        <option value="surat_izin_kegiatan" class="font-weight-bolder">SURAT IZIN KEGIATAN/REKOMENDASI</option>
                                        <option value="surat_ket_perubahan" class="font-weight-bolder">SURAT KETERANGAN PERUBAHAN NISN SISWA</option>
                                        <option value="surat_rekomendasi" class="font-weight-bolder">SURAT REKOMENDASI</option>
                                        <option value="surat_kelakuan_baik" class="font-weight-bolder">SURAT KETERANGAN BERKELAKUAN BAIK</option>
                                        <option value="surat_kesalahan_izazah" class="font-weight-bolder">SURAT KETERANGAN KESALAHAN PENULISAN IJAZAH</option>
                                        <option value="surat_keputusan_mts" class="font-weight-bolder">SURAT KEPUTUSAN KEPALA MADRASAH</option>
                                        <option value="surat_kesalahan_biodata" class="font-weight-bolder">SURAT KETERANGAN KESALAHAN BIODATA IJAZAH</option>
                                        <option value="surat_menerima_siswa" class="font-weight-bolder">SURAT KETERANGAN TELAH MENERIMA SISWA PINDAHAN</option>
                                        <option value="surat_keterangan" class="font-weight-bolder">SURAT KETERANGAN</option>
                                        <option value="surat_tugas" class="font-weight-bolder">SURAT PERINTAH TUGAS</option>
                                        <option value="surat_keluar" class="font-weight-bolder">SURAT KETERANGAN KELUAR/PINDAH</option>
                                   </select>
                                </div>
                            </div>
                        </div>

                        
                        <div class="col-sm-12">
                            <label class="col-sm-3"><strong>Konten Surat</strong></label>
                            <div class="form-group">
                                <textarea id="content" name="content" value="something"></textarea>
                            </div>
                        </div>

                        <div class="col-sm-12">
                            <button class="btn btn-primary" id="pnotify-success">Simpan</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<div class="base_url" hidden><?php echo base_url(); ?></div>

<script>
    var main_url = document.querySelector('.base_url').innerText;

    function onChangeTemplate(value){
        console.log(value)
        switch(value) {
          case "surat_izin_kegiatan":
            // code block
            insertContent(btoa(surat_izin_kegiatan))
            break;
          case "surat_ket_perubahan":
            // code block
            insertContent(btoa(surat_ket_perubahan))
            break;
          case "surat_rekomendasi":
            // code block
            insertContent(btoa(surat_rekomendasi))
            break;
          case "surat_kelakuan_baik":
            // code block
            insertContent(btoa(surat_kelakuan_baik))
            break;
          case "surat_kesalahan_izazah":
            // code block
            insertContent(btoa(surat_kesalahan_izazah))
            break;
          case "surat_keputusan_mts":
            // code block
            insertContent(btoa(surat_keputusan_mts))
            break;
          case "surat_kesalahan_biodata":
            // code block
            insertContent(btoa(surat_kesalahan_biodata))
            break;
          case "surat_menerima_siswa":
            // code block
            insertContent(btoa(surat_menerima_siswa))
            break;
          case "surat_keterangan":
            // code block
            insertContent(btoa(surat_keterangan))
            break;
          case "surat_tugas":
            // code block
            insertContent(btoa(surat_tugas))
            break;
          case "surat_keluar":
            // code block
            insertContent(btoa(surat_keluar))
            break;
          default:
            // code block
        }
    }
    var editor = new FroalaEditor('#content');
    

function insertContent(content){
    editor.html.insert('');
    setTimeout(editor.html.insert(atob(content)), 500);
}
// setTimeout(editor.html.insert(text_content), 500);

var surat_izin_kegiatan = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>SURAT IZIN KEGIATAN/REKOMENDASI</u></strong>
            <br>&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 430/PPI.31/MA/IV/2019</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>Yang bertanda tangan dibawah ini :</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:36.0pt;text-align:justify;line-height:115%;'>Nama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : <strong>Drs.</strong> <strong>H. Yudi Wildan Latief, S.H, M.H&nbsp;</strong>
            <br>NIP &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: -
            <br>Pangkat/gol.ruang &nbsp; &nbsp; &nbsp; : Kepala Madrasah Aliyah
            <br>Alamat sekolah &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : Jl. Pajagalan No. 115 Banjaran Kab. Bandung</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Dengan ini mengizinkan dan merekomendasikan kepada Organisasi Ekstrakulikuler SANTCAKA (Santri Cinta Kelestarian Alam) MA PERSIS 31 Banjaran untuk menyelenggarakan kegiatan &ldquo;EKSPEDISI GUNUNG GEDE PANGRANGO SANTCAKA&rdquo; yang akan dilaksanakan pada:&nbsp;</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:36.0pt;line-height:115%;'>Hari/Tanggal &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : Sabtu &ndash; &nbsp;Selasa &nbsp; 13 &ndash; 16 April 2019
            <br><span style="margin-left:36.0pt;text-indent: 36pt;">Tempat &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Taman Nasional Gn. Gede Pangrango, Cibodas, Kab Cianjur, Jawa Barat</span>
            <br><span style="margin-left:36.0pt;text-indent: 36pt;">Peserta &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 25 Orang</span>
            <br><span style="margin-left:36.0pt;text-indent: 36pt;">Penanggung Jawab &nbsp; &nbsp; : Rizky Fitrian</span>
            <br><span style="margin-left:36.0pt;text-indent: 36pt;">Pembina &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Elfa Maulana Yusron, S.Pd</span><span style="text-indent: 36pt;">&nbsp;</span></p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Dengan ketentuan agar memperhatikan hal-hal sebagai berikut:</p>

        <ol style="list-style-type: decimal;margin-left:11px;">
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Tidak mengganggu Kegiatan Belajar Mengajar</li>
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Menjaga keselamatan diri maupun rombongan</li>
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Tidak mengganggu ketertiban dan ketenangan masyarakat lingkungan tempat kegiatan dilaksanakan</li>
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Menjaga dan menjunjung tinggi nama baik Almamater MA PERSIS 31 Banjaran</li>
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Kegiatan dilaksanakan sesuai dengan proposal (perencanaan) yang ditetapkan</li>
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Memperhatikan waktu-waktu Sholat (kegiatan dihentikan mulai waktu adzan sampai selesai melaksanakan sholat) usahakan agar peserta melaksanakan sholat berjama&rsquo;ah di masjid terdekat</li>
            <li style='font-family: "Times New Roman", Times, serif, -webkit-standard; font-size: 16px;'>Menyampaikan laporan hasil kegiatan kepada Kepala Madrasah melalui kepala tata usaha, selambat-lambatnya satu minggu setelah kegiatan selesai dilaksanakan.</li>
        </ol>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Demikian surat&nbsp;izin dan rekomendasi&nbsp;ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Banjaran, 04 April 2019</span>
            <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

        <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>

        `;

var surat_ket_perubahan = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<u>SURAT KETERANGAN PERUBAHAN NISN SISWA</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nomor : 443/PPI.31/MA/IV/2019</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Yang bertanda tangan dibawah ini&nbsp;Kepala Madrasah MA PERSIS 31 Banjaran, Kabupaten Bandung Provinsi Jawa Barat menerangkan Bahwa:</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;margin-left:36.0pt;text-align:justify;line-height:150%;'>Atas Nama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;<strong>ADLINA AZIMAH</strong>&nbsp;
    <br>Tempat dan Tanggal lahir &nbsp; &nbsp; &nbsp; : Bandung, 25 Maret 2001
    <br>Nama Orang Tua &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Burhanuddin / Yati Nurhayati
    <br>NIS / NISN &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : 3204146503010001 / 0018989152
    <br>Tahun Pelajaran &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 2018/2019</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Terdapat penggantian atau Verval PD pada NISN siswa yang awalnya:
    <br><strong style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NISN:</strong><span style="text-align: left;">&nbsp;</span><strong style="text-align: left;">0017174213</strong>
    <br>Setelah proses perubahan Seharusnya:
    <br><strong style="text-indent: 36pt;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NISN:</strong><span style="text-indent: 36pt;">&nbsp;</span><strong style="text-indent: 36pt;">0018989152</strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Surat keterangan ini sebagai lampiran perubahan NISN print screen online pada http://nisn.data.kemdikbud.go.id&nbsp;
    <br>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;

var surat_rekomendasi = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<u>SURAT REKOMENDASI</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Yang bertanda tangan dibawah ini :
    <br>Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;<strong>Drs. H. Yudi Wildan Latief, SH., MH.</strong>
    <br>NIP&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:&nbsp;-
    <br>Pangkat/gol.ruang&nbsp; &nbsp; &nbsp; &nbsp;: Kepala Madrasah
    <br>Alamat sekolah&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;Jl. Pajagalan No. 115 Banjaran Kab. Bandung</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Memberikan rekomendasi kepada siswa/i :
    <br>Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;<strong>RIZKA FITRI AFIFAH</strong>
    <br>NIS&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: 131232040067150397
    <br>Jurusan&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: IPA
    <br>Alamat asal&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Kp. Bbk. Stasion RT 02 RW 04 &nbsp;Ds. Banjaran,&nbsp;Kec. Banjaran,&nbsp;Kab. Bandung</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Untuk mengikuti Program Beasiswa Bidikmisi Tahun Akademik 2019/2020&nbsp;di&nbsp;Universitas Islam Negeri Sunan Gunung Djati (UIN SGD) Bandung.</p>

<p><span style='font-size:16px;font-family:"Times New Roman",serif;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Demikian surat rekomendasi ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>`;

var surat_kelakuan_baik = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<u>SURAT KETERANGAN BERKELAKUAN BAIK</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp;&nbsp;<img src="`+main_url+`image/Picture1.png" style="width: 140px;" class="fr-fic fr-dib"></p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:115%;'>Yang bertanda tangan di bawah ini, Kepala Madrasah Tsanawiyah&nbsp;Persis Banjaran Kab. Bandung, menerangkan bahwa :</p>

<table border="0" cellpadding="0" cellspacing="0" style="margin-left:40.85pt;border-collapse:collapse;">
    <tbody>
        <tr>
            <td style="width: 23.3644%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="31.71641791044776%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Nama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:</p>
            </td>
            <td style="width: 76.7774%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="68.28358208955224%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'><strong>AULIYA MAULANI</strong></p>
            </td>
        </tr>
        <tr>
            <td style="width: 23.3644%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="31.71641791044776%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>NIS / NISN&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:</p>
            </td>
            <td style="width: 76.7774%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="68.28358208955224%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>121232040011200145/&nbsp;3080244372</p>
            </td>
        </tr>
        <tr>
            <td style="width: 23.3644%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="31.71641791044776%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Tempat, tanggal lahir&nbsp; :</p>
            </td>
            <td style="width: 76.7774%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="68.28358208955224%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Bandung, 12/07/2008</p>
            </td>
        </tr>
        <tr>
            <td style="width: 23.3644%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="31.71641791044776%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Nama Orang Tua &nbsp; &nbsp; &nbsp; &nbsp;:</p>
            </td>
            <td style="width: 76.7774%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="68.28358208955224%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Irman Nurdin Maulana/ Eneng Kharyati, S.Pd</p>
            </td>
        </tr>
        <tr>
            <td style="width: 23.3644%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="31.71641791044776%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Alamat&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; :</p>
            </td>
            <td style="width: 76.7774%; padding: 0cm 5.4pt; vertical-align: top;" valign="top" width="68.28358208955224%">

                <p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Kp. Cangkuang Rt/Tw 02/01, Desa Cangkuang, Kec Cangkuang, Kab. Bandung, Prov. Jawa Barat, 40238</p>
            </td>
        </tr>
    </tbody>
</table>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:115%;'>Berdasarkan pengamatan kami selama tercatat sebagai siswa&nbsp;MTs&nbsp;Persis&nbsp;Banjaran Kab. Bandung, siswa tersebut menunjukkan&nbsp;<strong>kelakuan baik serta belum pernah tersangkut kasus yang berkaitan dengan kenakalan remaja</strong><strong>,&nbsp;penyalahgunaan narkoba</strong>, maupun penyimpangan lainnya.</p>

<p><span style='font-size:16px;font-family:"Times New Roman",serif;'>Demikian keterangan ini dibuat dengan sesungguhnya dan dapat dipergunakan seperlunya.</span></p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<img src="`+main_url+`image/Picture2.jpg" style="width: 440px;" class="fr-fic fr-dib"></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;

var surat_kesalahan_izazah = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<u>SURAT KETERANGAN KESALAHAN PENULISAN IJAZAH</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Yang bertanda tangan dibawah ini&nbsp;Kepala Madrasah MTs&nbsp;PERSIS&nbsp;Banjaran, Kabupaten Bandung Provinsi Jawa Barat menerangkan Bahwa:</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nomor Seri Ijazah&nbsp;&nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: MTs-13 100040158
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Atas Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:&nbsp;<strong>ELSA ELFARIDA</strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Tempat dan Tanggal lahir&nbsp; &nbsp; &nbsp; &nbsp;: Bandung, 12 Desember 2002
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NIS/ NISN&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:&nbsp;151613579 / 002699255
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Tahun Ajaran&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: 2017/2018
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Asal Madrasah&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:&nbsp;MTs Persis Banjaran
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NPSN&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: 20278055
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;No peserta Ujian&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 2-18-02-10-680-126-3
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Kota / Kabupaten&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;Kab. Bandung
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Provinsi &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: Jawa Barat</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Terdapat kesalahan&nbsp;penulisan NISN pada Ijazah MTs:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NISN:&nbsp;<strong>029992555</strong><strong>&nbsp;</strong>
    <br>Seharusnya:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NISN:&nbsp;<strong>026992555</strong><strong>&nbsp;</strong>
    <br>Surat keterangan ini sebagai lampiran&nbsp;Ijazah MTs&nbsp;yang telah ada.
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;

var surat_keputusan_mts = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; SURAT KEPUTUSAN<br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;KEPALA MADRASAH TSANAWIYYAH PERSIS BANJARAN&nbsp;</strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nomor : 443/PPI.31/MA/IV/2019</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp; &nbsp;TENTANG</strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; PENGANGKATAN TENAGA PENDIDIK DAN TENAGA KEPENDIDIKAN
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; TAHUN PELAJARAN 2015/2016</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>Menimbang &nbsp; &nbsp; &nbsp; : Bahwa Kepala Madrasah adalah penanggung jawab atas penyelenggaraan kegiatan Pendidikan, administrasi Madrasah, santri dan kegiatan santri di Madrasah agar pelaksanaan tugas dan tanggung jawab tersebut lebih berhasil guna dan berdaya guna, maka Kepala Madrasah perlu dibantu oleh beberapa orang guru</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>Mengingat &nbsp; &nbsp; &nbsp; &nbsp; : 1. Peraturan Pemerintah No. 29/1990.
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 2. UU No. 20 Tahun 2003 Bab. X Pasal 36
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 3. Surat Kepala Kantor Kementrian Agama Kab. Bandung tentang Kalender Pendidikan
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 4. Rapat dan Konsultasi dengan Pimpinan Pesantren Persis 31 Banjaran.</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp; &nbsp; MEMUTUSKAN</strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>Menetapkan &nbsp; &nbsp; &nbsp;:
    <br>Pertama : Mengangkat dan menetapkan&nbsp;<strong>Rahman Taufiq, A.Md</strong> sebagai Tenaga Pendidik terhitung mulai tanggal 1 Juli 2015
    <br>Kedua &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan kepada anggaran yang sesuai
    <br>Ketiga &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : Apabila terdapat kekeliruan dalam keputusan ini akan diadakan perbaikan sebagaimana mestinya
    <br>Keempat &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Keputusan ini berlaku sejak tanggal ditetapkan.
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Ditetapkan di : BANJARAN
    <br><span style='font-size:16px;font-family:"Times New Roman",serif;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Pada tanggal &nbsp;: 1 Juli 2015</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>
    <br>
</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>
    <br>
</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>

<p style="margin:0cm;"><span>Tembusan :</span></p>

<ol style="list-style-type: decimal;">
    <li><span>Yth. Kepala Kemenag Kab. Bandung</span></li>
    <li><span>Yth. Ketua PC. PERSIS Banjaran</span></li>
    <li><span>Yth. Pimpinan Pesantren Persis 31 Banjaran</span></li>
</ol>
`;

var surat_kesalahan_izazah = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>SURAT KETERANGAN KESALAHAN BIODATA IJAZAH</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nomor : 443/PPI.31/MA/IV/2019</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Yang bertanda tangan dibawah ini&nbsp;Kepala Madrasah MTs PERSIS Banjaran, Kabupaten Bandung Provinsi Jawa Barat menerangkan Bahwa:</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Nomor Seri Ijazah&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : MTs 100022697
    <br>Atas Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;<strong>SARAH LAILA</strong>
    <br>Tempat dan Tanggal lahir&nbsp; &nbsp; &nbsp; &nbsp; : Bandung, 14 Juli 1996
    <br>Nama Orang Tua&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: SAMSUDIN
    <br>NIS &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 0910 12223</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Terdapat kesalahan pengentrian biodata&nbsp;Orang Tua:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nama Orang Tua Tertulis di Ijazah: SYAMSUDIN
    <br>Seharusnya:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nama Orang Tua Tertulis di Ijazah: SAMSUDIN&nbsp;<strong>&nbsp;</strong>
    <br>Surat keterangan ini sebagai lampiran&nbsp;Ijazah&nbsp;yang telah ada.
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>
    <br>
</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;text-indent:-78.0pt;line-height:115%;'>
    <br>
</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;

var surat_menerima_siswa = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;'><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor Statistik&nbsp;</span><span style="color:black;">Madrasah&nbsp;</span></p>

<p>
    <br>
</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style="color:black;">Madrasah</span><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; : MTsS PERSIS Banjaran</span><span style="color:black;">&nbsp;</span>
    <br><span style='font-size:16px;font-family:"Times New Roman",serif;color:black;'>Alamat &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Jln. Pajagalan No.115 RT.001/RW.005 Desa Banjaran, Kec. Banjaran, Kab. Bandung</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'>
    <br>
</p>

<p><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<u>SURAT KETERANGAN PERUBAHAN NISN SISWA</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p>
    <br>
</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style="color:black;">Yang bertanda tangan di bawah ini Kepala Madrasah MTsS PERSIS Banjaran menerangkan bahwa : &nbsp;</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</span><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</span><span style="color:black;">:&nbsp;</span><span style="color:black;">DENIZA FATHIRIL HAQ</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Tempat, Tgl Lahir&nbsp; &nbsp; &nbsp; &nbsp; :&nbsp;</span><span style="color:black;">Cianjur, 09 Juli 2007</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NISN&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; :&nbsp;0071861259
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Jenis Kelamin &nbsp;</span><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</span><span style="color:black;">:&nbsp;</span><span style="color:black;">Laki-laki</span><span style="color:black;">&nbsp;</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style="color:black;">Madrasah pindahan yang dituju :</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nama&nbsp;</span><span style="color:black;">Madrasah</span><span style="color:black;">&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: MTsS PERSIS Banjaran</span>
    <br><span style="color:#333333;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NPSN &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 20278055</span>
    <br><span style="color:#333333;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NSM &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 121232040011</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Alamat&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: Jln. Pajagalan No.115</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Desa / Kelurahan &nbsp; &nbsp; &nbsp; &nbsp;: Banjaran</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Kecamatan &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Banjaran</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Kabupaten&nbsp;</span><span style="color:black;">/ Kota</span><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: Bandung</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Propinsi &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: Jawa Barat</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Diterima tanggal&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: 17 Desember 2020</span>
    <br><span style="color:black;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Di tingkat / kelas &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: 8-F (Delapan)</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;'><span style="color:black;">Siap me</span><span style="color:black;">n</span><span style="color:black;">erima anak tersebut di atas sebagai siswa di&nbsp;</span><span style="color:black;">MTsS PERSIS Banjaran, Desa Banjaran, Kec. Banjaran, Kab. Bandung&nbsp;</span>
    <br><span style="color:black;">Demikian surat keterangan penerimaan siswa pindahan ini di buat, untuk dapat di pergunakan sebagaimana mestinya.</span></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>

<p>
    <br>
</p>
`;

var surat_keterangan = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<u>SURAT KETERANGAN</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;<img src="`+main_url+`image/Picture3.jpg" style="width: 140px;" class="fr-fic fr-dib"></p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Yang bertanda tangan di bawah ini :
    <br>Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;<strong>Drs. H. Yudi Wildan Latief, S.</strong><strong>H, M.</strong><strong>H</strong>
    <br>Jabatan&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : Kepala Madrasah
    <br>Unit Kerja&nbsp; &nbsp; &nbsp; &nbsp;: MTs Persis Banjaran</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Dengan ini menyatakan bahwa :
    <br>Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;<strong>FADLA HANA HAIFA</strong>
    <br>NIS/NISN&nbsp; &nbsp; &nbsp; &nbsp;: 121232040011190075 / 0064933512&nbsp; &nbsp;&nbsp;
    <br>Orang Tua&nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;Dindin / Ayu Ambarwati
    <br>Alamat&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;: Kp. Bojong peuteuy RT/RW - 02/05, Desa&nbsp;Langonsari, Kec.&nbsp;Pameungpeuk, Kab. Bandung</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>Sampai dengan surat ini ditetapkan, siswa tersebut di atas dinyatakan terdaftar dan aktif belajar di sekolah kami&nbsp;di kelas&nbsp;XI-C,&nbsp;MTs&nbsp;PERSIS Banjaran Kab. Bandung Terakreditasi&nbsp;A,&nbsp;pada&nbsp;Tahun Pelajaran 2021-2022.</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:115%;'>Demikian surat keterangan ini dibuat dengan sesungguhnya dan dapat dipergunakan seperlunya.</p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<img src="`+main_url+`image/Picture2.jpg" style="width: 440px;" class="fr-fic fr-dib"></p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp;</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;

var surat_tugas = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;<u>S U R A T P E R I N T A H T U G A S</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Yang bertanda tangan di bawah ini:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:&nbsp;&nbsp;<strong>Drs. H Yudi Wildan Latief, S.H, M.H</strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NIP&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;&nbsp;-
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Jabatan&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;&nbsp;Kepala Madrasah&nbsp;MTsS PERSIS Banjaran</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Menunjuk,&nbsp;Memberi tugas&nbsp;dan Tanggung Jawab&nbsp;kepada:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nama&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; :&nbsp;&nbsp;<strong>Drs. H Yudi Wildan Latief, S.H, M.H</strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;NUPTK/PegId&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;4448740642200043
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Jabatan&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;&nbsp;Kepala Madrasah
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Unit Kerja&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: &nbsp;MTsS PERSIS Banjaran</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Pada:
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Hari, tanggal&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:&nbsp;&nbsp;Selasa,&nbsp;30 Agustus 2022
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Tempat&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:&nbsp;&nbsp;Hotel Horizon Bandung, Jl. Pelajar Pejuang Bandung</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>
    <br>Untuk:&nbsp;<strong>Kegiatan Sosialisasi AKMI Tingkat Kabupaten / Kota.</strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;text-align:justify;line-height:150%;'>Demikian surat tugas ini kami buat untuk dilaksanakan sebaik-baiknya dengan penuh rasa tanggung jawab.</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><span style="text-align: left;">Catatan :&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Banjaran, 04 April 2019</span>
    <br>Ybs, telah melaksanakan tugas sesuai&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>dengan ketentuan tersebut di atas.</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;

var surat_keluar = `<p><img src="`+main_url+`image/header_surat.png" style="width: 540px;" class="fr-fic fr-dib"><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;<u>SURAT KETERANGAN KELUAR/PINDAH</u></strong>
    <br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Nomor : 443/PPI.31/MA/IV/2019</p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;<img src="`+main_url+`image/Picture3.jpg" style="width: 140px;" class="fr-fic fr-dib"></p>

<p id="isPasted" style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Yang bertanda tangan di bawah ini :</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Nama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; :&nbsp;<strong>Drs. H. Yudi Wildan Latief, SH., MH.</strong>
    <br>Jabatan &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : Kepala Madrasah
    <br>Unit Kerja &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: MTs Persis Banjaran</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Dengan ini&nbsp;menerangkan&nbsp;dengan sesungguhnya&nbsp;bahwa:</p>

<ol style="list-style-type: decimal;">
    <li>Nama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : <strong>SYIFA SALSABILA FEBRIANTI</strong></li>
    <li>Jenis Kelamin&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : P</li>
    <li>Tempat Tanggal Lahir&nbsp; &nbsp; &nbsp; &nbsp;&nbsp;: Bandung, 10/02/2009</li>
    <li>Agama &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : Islam</li>
    <li>Nama Orang Tua&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: TATA GUNIAWAN, S.PD / NOVIAWATI</li>
    <li>Alamat&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: KP. SIRNAGALIH RT.01 RW.06, Desa Pasirmulya, Kec Banjaran, Kab. Bandung, Prov. Jawa Barat, 40377</li>
    <li>Tgl masuk disekolah ini&nbsp; &nbsp; &nbsp;: 11/07/2022 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Diterima di kelas &nbsp; &nbsp; &nbsp;: VII A</li>
    <li>No. Induk &nbsp;Siswa&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp; : 121232040011210031 &nbsp; &nbsp; &nbsp;NISN &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; : 0099456642</li>
    <li>Tgl mutasi pindah&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; : 28/09/2022 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Duduk di kelas &nbsp; &nbsp; &nbsp;: VIII A</li>
    <li>Melanjutkan sekolah ke&nbsp; &nbsp; &nbsp;: MTsS PERSIS 123 Jalan Gunung Puntang, Kampung Sirnagalih, Desa, Pasirmulya, Kec. Banjaran, Kabupaten Bandung, Jawa Barat 40377</li>
    <li>NPSN / NSM&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;: 20278056 / 121232040012</li>
    <li>Alasan Melanjutkan&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: Pindah sekolah Karena Jarak sekolah dengan tempat tinggal jauh.</li>
</ol>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:115%;'>Demikian surat keterangan ini dibuat dengan sesungguhnya dan dapat dipergunakan seperlunya.</p>

<p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<img src="`+main_url+`image/Picture2.jpg" style="width: 440px;" class="fr-fic fr-dib"></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>Mengetahui,<span style="text-align: left;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Banjaran, 04 April 2019</span>
    <br>Orang Tua/Wali siswa &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Kepala Madrasah,</p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>a.n. <strong id="isPasted">SYIFA SALSABILA FEBRIANTI</strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'><strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <u>Drs. H. Yudi Wildan Latief, S.H, M.H</u></strong></p>

<p style='margin:0cm;font-size:16px;font-family:"Times New Roman",serif;line-height:150%;'>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; NIP. -&nbsp;</p>
`;
</script>

